using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Transforms;
using FlexiToggle.Api.DTOs;

namespace FlexiToggle.Api.Services;

public class MLNetRolloutAIService : IRolloutAIService
{
    private readonly MLContext _mlContext;
    private readonly ILogger<MLNetRolloutAIService> _logger;

    public MLNetRolloutAIService(ILogger<MLNetRolloutAIService> logger)
    {
        _mlContext = new MLContext(seed: 42);
        _logger = logger;
    }

    public async Task<AnomalyDetectionResponse> DetectAnomaliesAsync(AnomalyDetectionRequest request)
    {
        try
        {
            _logger.LogInformation("Detecting anomalies for flag {FlagKey} in project {ProjectKey}", 
                request.FeatureFlagKey, request.ProjectKey);

            // Preparar dados para detecção de anomalias
            var anomalyData = request.MetricHistory
                .Where(m => m.Timestamp >= DateTime.UtcNow.AddDays(-request.LookbackDays))
                .Select(m => new AnomalyInputData
                {
                    Timestamp = m.Timestamp.ToString("yyyy-MM-dd HH:mm:ss"),
                    Value = (float)m.Value
                })
                .ToList();

            if (!anomalyData.Any())
            {
                return new AnomalyDetectionResponse
                {
                    HasAnomalies = false,
                    OverallRiskScore = 0.0,
                    Recommendations = new List<string> { "Dados insuficientes para análise de anomalias" }
                };
            }

            // Criar pipeline de detecção de anomalias usando PCA
            var dataView = _mlContext.Data.LoadFromEnumerable(anomalyData);
            
            var pipeline = _mlContext.Transforms.DetectAnomaliesBySrCnn(
                outputColumnName: "Anomaly",
                inputColumnName: nameof(AnomalyInputData.Value),
                threshold: 0.3,
                batchSize: Math.Min(512, anomalyData.Count),
                sensitivity: 90.0,
                detectMode: SrCnnDetectMode.AnomalyAndMargin);

            var model = pipeline.Fit(dataView);
            var predictions = model.Transform(dataView);

            // Extrair resultados
            var anomalies = new List<AnomalyAlert>();
            var predictionResults = _mlContext.Data.CreateEnumerable<AnomalyPrediction>(predictions, false).ToList();

            for (int i = 0; i < predictionResults.Count; i++)
            {
                var prediction = predictionResults[i];
                var originalData = anomalyData[i];

                if (prediction.Prediction[0] == 1) // Anomalia detectada
                {
                    var severity = prediction.Prediction[2] > 0.8 ? "Critical" :
                                  prediction.Prediction[2] > 0.6 ? "High" :
                                  prediction.Prediction[2] > 0.4 ? "Medium" : "Low";

                    anomalies.Add(new AnomalyAlert
                    {
                        MetricName = request.MetricHistory[i].MetricName,
                        CurrentValue = originalData.Value,
                        ExpectedValue = prediction.Prediction[1],
                        Deviation = Math.Abs(originalData.Value - prediction.Prediction[1]),
                        Severity = severity,
                        DetectedAt = DateTime.Parse(originalData.Timestamp),
                        Description = $"Anomalia detectada: valor {originalData.Value:F2} desvia {Math.Abs(originalData.Value - prediction.Prediction[1]):F2} do esperado"
                    });
                }
            }

            var overallRiskScore = anomalies.Any() ? 
                anomalies.Average(a => a.Severity switch
                {
                    "Critical" => 1.0,
                    "High" => 0.8,
                    "Medium" => 0.6,
                    "Low" => 0.3,
                    _ => 0.0
                }) : 0.0;

            var recommendations = GenerateAnomalyRecommendations(anomalies, overallRiskScore);

            return new AnomalyDetectionResponse
            {
                HasAnomalies = anomalies.Any(),
                Anomalies = anomalies,
                OverallRiskScore = overallRiskScore,
                Recommendations = recommendations
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error detecting anomalies for flag {FlagKey}", request.FeatureFlagKey);
            return new AnomalyDetectionResponse
            {
                HasAnomalies = false,
                OverallRiskScore = 0.0,
                Recommendations = new List<string> { "Erro na análise de anomalias. Proceder com cautela." }
            };
        }
    }

    public async Task<RolloutPredictionResponse> PredictRolloutSuccessAsync(RolloutPredictionRequest request)
    {
        try
        {
            _logger.LogInformation("Predicting rollout success for flag {FlagKey}", request.FeatureFlagKey);

            // Preparar dados históricos para predição
            var trainingData = request.HistoricalData
                .GroupBy(m => m.Timestamp.Date)
                .Select(g => new RolloutTrainingData
                {
                    ErrorRate = (float)(g.FirstOrDefault(m => m.MetricName == "error_rate")?.Value ?? 0.0),
                    ResponseTime = (float)(g.FirstOrDefault(m => m.MetricName == "response_time")?.Value ?? 100.0),
                    ConversionRate = (float)(g.FirstOrDefault(m => m.MetricName == "conversion_rate")?.Value ?? 5.0),
                    UserCount = (float)(g.FirstOrDefault(m => m.MetricName == "user_count")?.Value ?? 100.0),
                    Success = g.Average(m => m.Value) > 0.7f // Critério de sucesso baseado nas métricas
                })
                .Where(d => d.ErrorRate > 0 || d.ResponseTime > 0 || d.ConversionRate > 0)
                .ToList();

            if (trainingData.Count < 5)
            {
                // Dados insuficientes, usar heurísticas
                return await PredictWithHeuristics(request);
            }

            // Criar pipeline de classificação
            var dataView = _mlContext.Data.LoadFromEnumerable(trainingData);
            
            var pipeline = _mlContext.Transforms.Concatenate("Features", 
                    nameof(RolloutTrainingData.ErrorRate),
                    nameof(RolloutTrainingData.ResponseTime),
                    nameof(RolloutTrainingData.ConversionRate),
                    nameof(RolloutTrainingData.UserCount))
                .Append(_mlContext.BinaryClassification.Trainers.SdcaLogisticRegression(
                    labelColumnName: nameof(RolloutTrainingData.Success),
                    featureColumnName: "Features"));

            var model = pipeline.Fit(dataView);

            // Fazer predição para configuração atual
            var currentMetrics = new RolloutTrainingData
            {
                ErrorRate = (float)(request.Configuration.SafetyLimits.GetValueOrDefault("error_rate", 1.0)),
                ResponseTime = (float)(request.Configuration.SafetyLimits.GetValueOrDefault("response_time", 200.0)),
                ConversionRate = (float)(request.Configuration.TargetMetrics.GetValueOrDefault("conversion_rate", 10.0)),
                UserCount = (float)(request.Configuration.Steps.LastOrDefault()?.PercentageTarget * 1000 ?? 1000)
            };

            var predictionEngine = _mlContext.Model.CreatePredictionEngine<RolloutTrainingData, RolloutPredictionResult>(model);
            var prediction = predictionEngine.Predict(currentMetrics);

            // Analisar fatores de risco
            var riskFactors = AnalyzeRiskFactors(request, currentMetrics);
            
            // Gerar recomendações
            var recommendations = GeneratePredictionRecommendations(prediction, riskFactors);

            // Estimar duração baseada na configuração
            var estimatedDuration = request.Configuration.Steps.Aggregate(TimeSpan.Zero, 
                (total, step) => total.Add(step.Duration));

            return new RolloutPredictionResponse
            {
                SuccessProbability = Math.Max(0.1, Math.Min(0.99, prediction.Probability)),
                RiskFactors = riskFactors,
                Recommendations = recommendations,
                MetricPredictions = new Dictionary<string, double>
                {
                    ["error_rate"] = currentMetrics.ErrorRate,
                    ["response_time"] = currentMetrics.ResponseTime,
                    ["conversion_rate"] = currentMetrics.ConversionRate,
                    ["user_impact"] = currentMetrics.UserCount
                },
                EstimatedDuration = estimatedDuration
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error predicting rollout success for flag {FlagKey}", request.FeatureFlagKey);
            return await PredictWithHeuristics(request);
        }
    }

    public async Task<RolloutSimulationResponse> SimulateRolloutAsync(RolloutSimulationRequest request)
    {
        try
        {
            _logger.LogInformation("Simulating rollout for flag {FlagKey}", request.FeatureFlagKey);

            var simulationSteps = new List<SimulationStep>();
            var currentMetrics = request.BaselineMetrics.ToDictionary(m => m.MetricName, m => m.Value);

            foreach (var step in request.Configuration.Steps)
            {
                // Simular impacto de cada etapa
                var stepMetrics = SimulateStepImpact(step, currentMetrics, request.Configuration);
                
                // Decisão da IA para esta etapa
                var aiDecision = MakeAIDecision(step, stepMetrics, request.Configuration);
                
                // Ajustar duração baseada na decisão da IA
                var adjustedDuration = AdjustDurationBasedOnAI(step.Duration, aiDecision);

                simulationSteps.Add(new SimulationStep
                {
                    Step = step,
                    AiDecision = aiDecision,
                    PredictedMetrics = stepMetrics,
                    EstimatedDuration = adjustedDuration
                });

                // Atualizar métricas para próxima etapa
                currentMetrics = stepMetrics;
            }

            // Predição geral do rollout
            var overallPrediction = new RolloutPrediction
            {
                SuccessProbability = CalculateOverallSuccessProbability(simulationSteps),
                RiskFactors = IdentifyOverallRiskFactors(simulationSteps),
                ExpectedMetrics = currentMetrics
            };

            // Gerar ajustes recomendados
            var recommendedAdjustments = GenerateRolloutAdjustments(simulationSteps, overallPrediction);

            // Métricas preditas ao longo do tempo
            var predictedMetrics = GenerateTimeSeriesPredictions(simulationSteps, request.SimulationDays);

            return new RolloutSimulationResponse
            {
                SimulationSteps = simulationSteps,
                OverallPrediction = overallPrediction,
                RecommendedAdjustments = recommendedAdjustments,
                PredictedMetrics = predictedMetrics
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error simulating rollout for flag {FlagKey}", request.FeatureFlagKey);
            return new RolloutSimulationResponse
            {
                SimulationSteps = new List<SimulationStep>(),
                OverallPrediction = new RolloutPrediction { SuccessProbability = 0.5 },
                RecommendedAdjustments = new List<string> { "Erro na simulação. Proceder com configuração padrão." }
            };
        }
    }

    public async Task<RolloutRecommendations> GetRolloutRecommendationsAsync(RolloutRecommendationRequest request)
    {
        try
        {
            _logger.LogInformation("Generating rollout recommendations for flag {FlagKey}", request.FeatureFlagKey);

            // Analisar métricas atuais
            var currentPerformance = AnalyzeCurrentPerformance(request.CurrentMetrics);
            
            // Gerar configuração otimizada baseada no objetivo
            var recommendedConfig = OptimizeConfiguration(request.CurrentConfiguration, 
                currentPerformance, request.OptimizationGoal);

            // Justificar as recomendações
            var justifications = GenerateConfigurationJustifications(
                request.CurrentConfiguration, recommendedConfig, currentPerformance);

            // Calcular confiança na recomendação
            var confidenceScore = CalculateRecommendationConfidence(
                currentPerformance, recommendedConfig, request.CurrentMetrics.Count);

            // Identificar mitigações de risco
            var riskMitigations = IdentifyRiskMitigations(recommendedConfig, currentPerformance);

            return new RolloutRecommendations
            {
                RecommendedConfiguration = recommendedConfig,
                Justifications = justifications,
                ConfidenceScore = confidenceScore,
                RiskMitigations = riskMitigations
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating recommendations for flag {FlagKey}", request.FeatureFlagKey);
            return new RolloutRecommendations
            {
                RecommendedConfiguration = request.CurrentConfiguration,
                Justifications = new List<string> { "Erro na geração de recomendações. Manter configuração atual." },
                ConfidenceScore = 0.5
            };
        }
    }

    public async Task<RealtimeAnalysisResponse> AnalyzeRealtimeMetricsAsync(RealtimeAnalysisRequest request)
    {
        try
        {
            _logger.LogInformation("Analyzing realtime metrics for flag {FlagKey}", request.FeatureFlagKey);

            var currentMetrics = request.RealtimeMetrics
                .GroupBy(m => m.MetricName)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(m => m.Timestamp).First().Value);

            // Analisar métricas em tempo real
            var alerts = GenerateRealtimeAlerts(currentMetrics, request.ActiveConfiguration);
            
            // Determinar ação recomendada
            var recommendedAction = DetermineRecommendedAction(alerts, currentMetrics, request.ActiveConfiguration);
            
            // Gerar raciocínio para a decisão
            var reasoning = GenerateActionReasoning(recommendedAction, alerts, currentMetrics);
            
            // Calcular nível de confiança
            var confidenceLevel = CalculateActionConfidence(alerts, currentMetrics);

            return new RealtimeAnalysisResponse
            {
                RecommendedAction = recommendedAction,
                Reasoning = reasoning,
                ConfidenceLevel = confidenceLevel,
                Alerts = alerts,
                CurrentMetrics = currentMetrics
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing realtime metrics for flag {FlagKey}", request.FeatureFlagKey);
            return new RealtimeAnalysisResponse
            {
                RecommendedAction = "pause",
                Reasoning = "Erro na análise em tempo real. Pausando por segurança.",
                ConfidenceLevel = 0.9,
                Alerts = new List<MetricAlert>(),
                CurrentMetrics = new Dictionary<string, double>()
            };
        }
    }

    // Métodos auxiliares privados
    private async Task<RolloutPredictionResponse> PredictWithHeuristics(RolloutPredictionRequest request)
    {
        // Implementação de heurísticas quando não há dados suficientes para ML
        var baseSuccessRate = 0.75;
        
        // Ajustar baseado na configuração
        if (request.Configuration.Strategy == "conservative") baseSuccessRate += 0.1;
        if (request.Configuration.Strategy == "aggressive") baseSuccessRate -= 0.15;
        
        var riskFactors = new List<RiskFactor>();
        
        // Analisar limites de segurança
        if (request.Configuration.SafetyLimits.GetValueOrDefault("error_rate", 1.0) > 2.0)
        {
            riskFactors.Add(new RiskFactor
            {
                Name = "Taxa de erro elevada",
                Level = "High",
                Impact = 0.2,
                Description = "Limite de taxa de erro muito alto pode impactar usuários"
            });
            baseSuccessRate -= 0.1;
        }

        return new RolloutPredictionResponse
        {
            SuccessProbability = Math.Max(0.1, Math.Min(0.99, baseSuccessRate)),
            RiskFactors = riskFactors,
            Recommendations = new List<string>
            {
                "Dados históricos insuficientes para predição precisa",
                "Recomenda-se rollout conservativo com monitoramento intensivo",
                "Coletar mais dados para melhorar predições futuras"
            },
            EstimatedDuration = request.Configuration.Steps.Aggregate(TimeSpan.Zero, (total, step) => total.Add(step.Duration))
        };
    }

    private List<string> GenerateAnomalyRecommendations(List<AnomalyAlert> anomalies, double riskScore)
    {
        var recommendations = new List<string>();
        
        if (!anomalies.Any())
        {
            recommendations.Add("✅ Nenhuma anomalia detectada. Rollout pode prosseguir normalmente.");
            return recommendations;
        }

        if (riskScore > 0.8)
        {
            recommendations.Add("🚨 Alto risco detectado. Considere pausar o rollout e investigar.");
        }
        else if (riskScore > 0.6)
        {
            recommendations.Add("⚠️ Risco moderado. Prosseguir com cautela e monitoramento intensivo.");
        }
        else
        {
            recommendations.Add("📊 Anomalias menores detectadas. Monitorar de perto.");
        }

        var criticalAnomalies = anomalies.Where(a => a.Severity == "Critical").ToList();
        if (criticalAnomalies.Any())
        {
            recommendations.Add($"🔴 {criticalAnomalies.Count} anomalia(s) crítica(s) detectada(s)");
        }

        return recommendations;
    }

    private List<RiskFactor> AnalyzeRiskFactors(RolloutPredictionRequest request, RolloutTrainingData metrics)
    {
        var riskFactors = new List<RiskFactor>();

        if (metrics.ErrorRate > 2.0)
        {
            riskFactors.Add(new RiskFactor
            {
                Name = "Taxa de erro elevada",
                Level = "High",
                Impact = 0.3,
                Description = $"Taxa de erro de {metrics.ErrorRate:F2}% está acima do recomendado"
            });
        }

        if (metrics.ResponseTime > 500)
        {
            riskFactors.Add(new RiskFactor
            {
                Name = "Tempo de resposta alto",
                Level = "Medium",
                Impact = 0.2,
                Description = $"Tempo de resposta de {metrics.ResponseTime:F0}ms pode impactar experiência"
            });
        }

        if (metrics.ConversionRate < 5.0)
        {
            riskFactors.Add(new RiskFactor
            {
                Name = "Baixa conversão",
                Level = "Medium",
                Impact = 0.15,
                Description = $"Taxa de conversão de {metrics.ConversionRate:F2}% está abaixo da média"
            });
        }

        return riskFactors;
    }

    private List<string> GeneratePredictionRecommendations(RolloutPredictionResult prediction, List<RiskFactor> riskFactors)
    {
        var recommendations = new List<string>();

        if (prediction.Probability > 0.8)
        {
            recommendations.Add("✅ Alta probabilidade de sucesso. Rollout pode prosseguir conforme planejado.");
        }
        else if (prediction.Probability > 0.6)
        {
            recommendations.Add("⚠️ Probabilidade moderada de sucesso. Considere rollout mais conservativo.");
        }
        else
        {
            recommendations.Add("🚨 Baixa probabilidade de sucesso. Revisar configuração antes de prosseguir.");
        }

        foreach (var risk in riskFactors.Where(r => r.Level == "High"))
        {
            recommendations.Add($"🔴 Mitigar: {risk.Description}");
        }

        return recommendations;
    }

    private Dictionary<string, double> SimulateStepImpact(RolloutStep step, Dictionary<string, double> currentMetrics, RolloutConfiguration config)
    {
        var simulatedMetrics = new Dictionary<string, double>(currentMetrics);
        
        // Simular impacto baseado na porcentagem do rollout
        var impactFactor = step.PercentageTarget / 100.0;
        
        // Simular mudanças nas métricas (exemplo simplificado)
        if (simulatedMetrics.ContainsKey("error_rate"))
        {
            simulatedMetrics["error_rate"] *= (1 + impactFactor * 0.1); // Pequeno aumento na taxa de erro
        }
        
        if (simulatedMetrics.ContainsKey("response_time"))
        {
            simulatedMetrics["response_time"] *= (1 + impactFactor * 0.05); // Pequeno aumento no tempo de resposta
        }
        
        if (simulatedMetrics.ContainsKey("conversion_rate"))
        {
            simulatedMetrics["conversion_rate"] *= (1 + impactFactor * 0.15); // Melhoria na conversão
        }

        return simulatedMetrics;
    }

    private AIDecision MakeAIDecision(RolloutStep step, Dictionary<string, double> metrics, RolloutConfiguration config)
    {
        var errorRate = metrics.GetValueOrDefault("error_rate", 0.0);
        var responseTime = metrics.GetValueOrDefault("response_time", 100.0);
        
        var maxErrorRate = config.SafetyLimits.GetValueOrDefault("error_rate", 2.0);
        var maxResponseTime = config.SafetyLimits.GetValueOrDefault("response_time", 500.0);

        if (errorRate > maxErrorRate * 1.5 || responseTime > maxResponseTime * 1.5)
        {
            return new AIDecision
            {
                RecommendedAction = "rollback",
                Confidence = 0.9,
                Reasoning = "Métricas críticas ultrapassaram limites de segurança",
                Considerations = new List<string> { "Taxa de erro ou tempo de resposta muito altos" }
            };
        }
        else if (errorRate > maxErrorRate || responseTime > maxResponseTime)
        {
            return new AIDecision
            {
                RecommendedAction = "pause",
                Confidence = 0.8,
                Reasoning = "Métricas próximas aos limites de segurança",
                Considerations = new List<string> { "Monitorar de perto antes de prosseguir" }
            };
        }
        else if (errorRate < maxErrorRate * 0.5 && responseTime < maxResponseTime * 0.7)
        {
            return new AIDecision
            {
                RecommendedAction = "accelerate",
                Confidence = 0.7,
                Reasoning = "Métricas excelentes permitem aceleração",
                Considerations = new List<string> { "Performance melhor que esperada" }
            };
        }
        else
        {
            return new AIDecision
            {
                RecommendedAction = "proceed",
                Confidence = 0.8,
                Reasoning = "Métricas dentro dos parâmetros esperados",
                Considerations = new List<string> { "Rollout pode prosseguir conforme planejado" }
            };
        }
    }

    private TimeSpan AdjustDurationBasedOnAI(TimeSpan originalDuration, AIDecision decision)
    {
        return decision.RecommendedAction switch
        {
            "accelerate" => TimeSpan.FromMilliseconds(originalDuration.TotalMilliseconds * 0.7),
            "pause" => TimeSpan.FromMilliseconds(originalDuration.TotalMilliseconds * 1.5),
            "rollback" => TimeSpan.Zero,
            _ => originalDuration
        };
    }

    private double CalculateOverallSuccessProbability(List<SimulationStep> steps)
    {
        if (!steps.Any()) return 0.5;
        
        var rollbackSteps = steps.Count(s => s.AiDecision.RecommendedAction == "rollback");
        var pauseSteps = steps.Count(s => s.AiDecision.RecommendedAction == "pause");
        
        var baseProbability = 0.8;
        baseProbability -= rollbackSteps * 0.3;
        baseProbability -= pauseSteps * 0.1;
        
        return Math.Max(0.1, Math.Min(0.99, baseProbability));
    }

    private List<RiskFactor> IdentifyOverallRiskFactors(List<SimulationStep> steps)
    {
        var riskFactors = new List<RiskFactor>();
        
        var rollbackCount = steps.Count(s => s.AiDecision.RecommendedAction == "rollback");
        if (rollbackCount > 0)
        {
            riskFactors.Add(new RiskFactor
            {
                Name = "Rollback necessário",
                Level = "High",
                Impact = 0.4,
                Description = $"{rollbackCount} etapa(s) requerem rollback"
            });
        }
        
        var pauseCount = steps.Count(s => s.AiDecision.RecommendedAction == "pause");
        if (pauseCount > steps.Count / 2)
        {
            riskFactors.Add(new RiskFactor
            {
                Name = "Múltiplas pausas necessárias",
                Level = "Medium",
                Impact = 0.2,
                Description = $"{pauseCount} etapa(s) requerem pausa"
            });
        }
        
        return riskFactors;
    }

    private List<string> GenerateRolloutAdjustments(List<SimulationStep> steps, RolloutPrediction prediction)
    {
        var adjustments = new List<string>();
        
        if (prediction.SuccessProbability < 0.6)
        {
            adjustments.Add("🎯 Reduzir velocidade do rollout em 50%");
            adjustments.Add("📊 Implementar monitoramento mais rigoroso");
        }
        
        var rollbackSteps = steps.Where(s => s.AiDecision.RecommendedAction == "rollback").ToList();
        if (rollbackSteps.Any())
        {
            adjustments.Add($"🚨 Revisar configuração das etapas {string.Join(", ", rollbackSteps.Select(s => s.Step.StepNumber))}");
        }
        
        if (steps.All(s => s.AiDecision.RecommendedAction == "proceed" || s.AiDecision.RecommendedAction == "accelerate"))
        {
            adjustments.Add("✅ Configuração otimizada pela IA");
            adjustments.Add("🚀 Rollout pode ser acelerado com segurança");
        }
        
        return adjustments;
    }

    private Dictionary<string, List<MetricDataPoint>> GenerateTimeSeriesPredictions(List<SimulationStep> steps, int days)
    {
        var predictions = new Dictionary<string, List<MetricDataPoint>>();
        var metricNames = new[] { "error_rate", "response_time", "conversion_rate", "user_count" };
        
        foreach (var metricName in metricNames)
        {
            var dataPoints = new List<MetricDataPoint>();
            var currentTime = DateTime.UtcNow;
            
            for (int day = 0; day < days; day++)
            {
                var stepIndex = Math.Min(day / (days / Math.Max(1, steps.Count)), steps.Count - 1);
                var step = steps.ElementAtOrDefault(stepIndex);
                
                var value = step?.PredictedMetrics.GetValueOrDefault(metricName, 0.0) ?? 0.0;
                
                dataPoints.Add(new MetricDataPoint
                {
                    Timestamp = currentTime.AddDays(day),
                    MetricName = metricName,
                    Value = value,
                    Tags = new Dictionary<string, string> { ["step"] = stepIndex.ToString() }
                });
            }
            
            predictions[metricName] = dataPoints;
        }
        
        return predictions;
    }

    private Dictionary<string, double> AnalyzeCurrentPerformance(List<MetricDataPoint> metrics)
    {
        return metrics
            .GroupBy(m => m.MetricName)
            .ToDictionary(g => g.Key, g => g.Average(m => m.Value));
    }

    private RolloutConfiguration OptimizeConfiguration(RolloutConfiguration current, Dictionary<string, double> performance, string goal)
    {
        var optimized = new RolloutConfiguration
        {
            Steps = new List<RolloutStep>(current.Steps),
            TargetMetrics = new Dictionary<string, double>(current.TargetMetrics),
            SafetyLimits = new Dictionary<string, double>(current.SafetyLimits),
            Strategy = goal
        };

        // Ajustar baseado no objetivo
        switch (goal)
        {
            case "conservative":
                // Etapas menores e mais lentas
                for (int i = 0; i < optimized.Steps.Count; i++)
                {
                    optimized.Steps[i].PercentageTarget *= 0.7;
                    optimized.Steps[i].Duration = TimeSpan.FromMilliseconds(optimized.Steps[i].Duration.TotalMilliseconds * 1.5);
                }
                break;
                
            case "aggressive":
                // Etapas maiores e mais rápidas
                for (int i = 0; i < optimized.Steps.Count; i++)
                {
                    optimized.Steps[i].PercentageTarget = Math.Min(100, optimized.Steps[i].PercentageTarget * 1.3);
                    optimized.Steps[i].Duration = TimeSpan.FromMilliseconds(optimized.Steps[i].Duration.TotalMilliseconds * 0.7);
                }
                break;
        }

        return optimized;
    }

    private List<string> GenerateConfigurationJustifications(RolloutConfiguration current, RolloutConfiguration recommended, Dictionary<string, double> performance)
    {
        var justifications = new List<string>();
        
        if (recommended.Strategy != current.Strategy)
        {
            justifications.Add($"Estratégia alterada para '{recommended.Strategy}' baseada na performance atual");
        }
        
        var avgErrorRate = performance.GetValueOrDefault("error_rate", 0.0);
        if (avgErrorRate > 1.0)
        {
            justifications.Add("Rollout mais conservativo recomendado devido à taxa de erro elevada");
        }
        
        var avgResponseTime = performance.GetValueOrDefault("response_time", 100.0);
        if (avgResponseTime < 100.0)
        {
            justifications.Add("Performance excelente permite rollout mais agressivo");
        }
        
        return justifications;
    }

    private double CalculateRecommendationConfidence(Dictionary<string, double> performance, RolloutConfiguration config, int dataPointCount)
    {
        var baseConfidence = 0.7;
        
        // Mais dados = maior confiança
        if (dataPointCount > 100) baseConfidence += 0.2;
        else if (dataPointCount > 50) baseConfidence += 0.1;
        else if (dataPointCount < 10) baseConfidence -= 0.3;
        
        // Performance estável = maior confiança
        var errorRate = performance.GetValueOrDefault("error_rate", 0.0);
        if (errorRate < 0.5) baseConfidence += 0.1;
        else if (errorRate > 2.0) baseConfidence -= 0.2;
        
        return Math.Max(0.1, Math.Min(0.99, baseConfidence));
    }

    private List<RiskMitigation> IdentifyRiskMitigations(RolloutConfiguration config, Dictionary<string, double> performance)
    {
        var mitigations = new List<RiskMitigation>();
        
        var errorRate = performance.GetValueOrDefault("error_rate", 0.0);
        if (errorRate > 1.0)
        {
            mitigations.Add(new RiskMitigation
            {
                RiskType = "High Error Rate",
                MitigationStrategy = "Implementar circuit breaker e rollback automático",
                EffectivenessScore = 0.8
            });
        }
        
        if (config.Steps.Any(s => s.PercentageTarget > 50))
        {
            mitigations.Add(new RiskMitigation
            {
                RiskType = "Large Rollout Steps",
                MitigationStrategy = "Dividir etapas grandes em incrementos menores",
                EffectivenessScore = 0.7
            });
        }
        
        return mitigations;
    }

    private List<MetricAlert> GenerateRealtimeAlerts(Dictionary<string, double> metrics, RolloutConfiguration config)
    {
        var alerts = new List<MetricAlert>();
        
        var errorRate = metrics.GetValueOrDefault("error_rate", 0.0);
        var errorThreshold = config.SafetyLimits.GetValueOrDefault("error_rate", 2.0);
        
        if (errorRate > errorThreshold)
        {
            alerts.Add(new MetricAlert
            {
                MetricName = "error_rate",
                CurrentValue = errorRate,
                ThresholdValue = errorThreshold,
                AlertType = errorRate > errorThreshold * 1.5 ? "critical" : "warning",
                Message = $"Taxa de erro ({errorRate:F2}%) ultrapassou limite ({errorThreshold:F2}%)"
            });
        }
        
        var responseTime = metrics.GetValueOrDefault("response_time", 0.0);
        var responseThreshold = config.SafetyLimits.GetValueOrDefault("response_time", 500.0);
        
        if (responseTime > responseThreshold)
        {
            alerts.Add(new MetricAlert
            {
                MetricName = "response_time",
                CurrentValue = responseTime,
                ThresholdValue = responseThreshold,
                AlertType = responseTime > responseThreshold * 1.5 ? "critical" : "warning",
                Message = $"Tempo de resposta ({responseTime:F0}ms) ultrapassou limite ({responseThreshold:F0}ms)"
            });
        }
        
        return alerts;
    }

    private string DetermineRecommendedAction(List<MetricAlert> alerts, Dictionary<string, double> metrics, RolloutConfiguration config)
    {
        var criticalAlerts = alerts.Where(a => a.AlertType == "critical").ToList();
        if (criticalAlerts.Any())
        {
            return "rollback";
        }
        
        var warningAlerts = alerts.Where(a => a.AlertType == "warning").ToList();
        if (warningAlerts.Count > 1)
        {
            return "pause";
        }
        else if (warningAlerts.Any())
        {
            return "continue";
        }
        
        // Se todas as métricas estão muito boas, pode acelerar
        var errorRate = metrics.GetValueOrDefault("error_rate", 0.0);
        var responseTime = metrics.GetValueOrDefault("response_time", 0.0);
        
        if (errorRate < 0.1 && responseTime < 100.0)
        {
            return "accelerate";
        }
        
        return "continue";
    }

    private string GenerateActionReasoning(string action, List<MetricAlert> alerts, Dictionary<string, double> metrics)
    {
        return action switch
        {
            "rollback" => $"Rollback necessário devido a {alerts.Count(a => a.AlertType == "critical")} alerta(s) crítico(s)",
            "pause" => $"Pausa recomendada devido a {alerts.Count} alerta(s) de warning",
            "accelerate" => "Métricas excelentes permitem aceleração do rollout",
            "continue" => "Métricas dentro dos parâmetros normais, prosseguir conforme planejado",
            _ => "Ação padrão baseada na análise atual"
        };
    }

    private double CalculateActionConfidence(List<MetricAlert> alerts, Dictionary<string, double> metrics)
    {
        var baseConfidence = 0.8;
        
        // Mais alertas = menor confiança na decisão de continuar
        if (alerts.Any(a => a.AlertType == "critical")) baseConfidence = 0.95; // Alta confiança em rollback
        else if (alerts.Count > 2) baseConfidence -= 0.2;
        else if (!alerts.Any()) baseConfidence += 0.1; // Alta confiança quando não há alertas
        
        return Math.Max(0.1, Math.Min(0.99, baseConfidence));
    }
}

// Classes para ML.NET
public class AnomalyInputData
{
    public string Timestamp { get; set; } = string.Empty;
    public float Value { get; set; }
}

public class AnomalyPrediction
{
    [VectorType(3)]
    public double[] Prediction { get; set; } = new double[3];
}

public class RolloutTrainingData
{
    public float ErrorRate { get; set; }
    public float ResponseTime { get; set; }
    public float ConversionRate { get; set; }
    public float UserCount { get; set; }
    public bool Success { get; set; }
}

public class RolloutPredictionResult
{
    public bool PredictedLabel { get; set; }
    public float Probability { get; set; }
    public float Score { get; set; }
}
