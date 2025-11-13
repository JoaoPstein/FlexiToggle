using FlexiToggle.Api.DTOs;

namespace FlexiToggle.Api.Services;

public interface IRolloutAIService
{
    Task<AnomalyDetectionResponse> DetectAnomaliesAsync(AnomalyDetectionRequest request);
    Task<RolloutPredictionResponse> PredictRolloutSuccessAsync(RolloutPredictionRequest request);
    Task<RolloutSimulationResponse> SimulateRolloutAsync(RolloutSimulationRequest request);
    Task<RolloutRecommendations> GetRolloutRecommendationsAsync(RolloutRecommendationRequest request);
    Task<RealtimeAnalysisResponse> AnalyzeRealtimeMetricsAsync(RealtimeAnalysisRequest request);
}

// DTOs para IA
public class AnomalyDetectionRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string FeatureFlagKey { get; set; } = string.Empty;
    public List<MetricDataPoint> MetricHistory { get; set; } = new();
    public int LookbackDays { get; set; } = 7;
}

public class AnomalyDetectionResponse
{
    public bool HasAnomalies { get; set; }
    public List<AnomalyAlert> Anomalies { get; set; } = new();
    public double OverallRiskScore { get; set; }
    public List<string> Recommendations { get; set; } = new();
}

public class AnomalyAlert
{
    public string MetricName { get; set; } = string.Empty;
    public double CurrentValue { get; set; }
    public double ExpectedValue { get; set; }
    public double Deviation { get; set; }
    public string Severity { get; set; } = string.Empty; // Low, Medium, High, Critical
    public DateTime DetectedAt { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class RolloutPredictionRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string FeatureFlagKey { get; set; } = string.Empty;
    public RolloutConfiguration Configuration { get; set; } = new();
    public List<MetricDataPoint> HistoricalData { get; set; } = new();
    public Dictionary<string, object> UserAttributes { get; set; } = new();
}

public class RolloutPredictionResponse
{
    public double SuccessProbability { get; set; }
    public List<RiskFactor> RiskFactors { get; set; } = new();
    public List<string> Recommendations { get; set; } = new();
    public Dictionary<string, double> MetricPredictions { get; set; } = new();
    public TimeSpan EstimatedDuration { get; set; }
}

public class RolloutSimulationRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string FeatureFlagKey { get; set; } = string.Empty;
    public RolloutConfiguration Configuration { get; set; } = new();
    public List<MetricDataPoint> BaselineMetrics { get; set; } = new();
    public int SimulationDays { get; set; } = 30;
}

public class RolloutSimulationResponse
{
    public List<SimulationStep> SimulationSteps { get; set; } = new();
    public RolloutPrediction OverallPrediction { get; set; } = new();
    public List<string> RecommendedAdjustments { get; set; } = new();
    public Dictionary<string, List<MetricDataPoint>> PredictedMetrics { get; set; } = new();
}

public class RolloutRecommendationRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string FeatureFlagKey { get; set; } = string.Empty;
    public List<MetricDataPoint> CurrentMetrics { get; set; } = new();
    public RolloutConfiguration CurrentConfiguration { get; set; } = new();
    public string OptimizationGoal { get; set; } = "balanced"; // conservative, balanced, aggressive
}

public class RolloutRecommendations
{
    public RolloutConfiguration RecommendedConfiguration { get; set; } = new();
    public List<string> Justifications { get; set; } = new();
    public double ConfidenceScore { get; set; }
    public List<RiskMitigation> RiskMitigations { get; set; } = new();
}

public class RealtimeAnalysisRequest
{
    public string ProjectKey { get; set; } = string.Empty;
    public string Environment { get; set; } = string.Empty;
    public string FeatureFlagKey { get; set; } = string.Empty;
    public List<MetricDataPoint> RealtimeMetrics { get; set; } = new();
    public RolloutConfiguration ActiveConfiguration { get; set; } = new();
}

public class RealtimeAnalysisResponse
{
    public string RecommendedAction { get; set; } = string.Empty; // continue, pause, rollback, accelerate
    public string Reasoning { get; set; } = string.Empty;
    public double ConfidenceLevel { get; set; }
    public List<MetricAlert> Alerts { get; set; } = new();
    public Dictionary<string, double> CurrentMetrics { get; set; } = new();
}

// Classes de apoio
public class MetricDataPoint
{
    public DateTime Timestamp { get; set; }
    public string MetricName { get; set; } = string.Empty;
    public double Value { get; set; }
    public Dictionary<string, string> Tags { get; set; } = new();
}

public class RolloutConfiguration
{
    public List<RolloutStep> Steps { get; set; } = new();
    public Dictionary<string, double> TargetMetrics { get; set; } = new();
    public Dictionary<string, double> SafetyLimits { get; set; } = new();
    public string Strategy { get; set; } = "balanced";
}

public class RolloutStep
{
    public int StepNumber { get; set; }
    public double PercentageTarget { get; set; }
    public TimeSpan Duration { get; set; }
    public List<string> Conditions { get; set; } = new();
}

public class RiskFactor
{
    public string Name { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty; // Low, Medium, High
    public double Impact { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class SimulationStep
{
    public RolloutStep Step { get; set; } = new();
    public AIDecision AiDecision { get; set; } = new();
    public Dictionary<string, double> PredictedMetrics { get; set; } = new();
    public TimeSpan EstimatedDuration { get; set; }
}

public class AIDecision
{
    public string RecommendedAction { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public string Reasoning { get; set; } = string.Empty;
    public List<string> Considerations { get; set; } = new();
}

public class RolloutPrediction
{
    public double SuccessProbability { get; set; }
    public List<RiskFactor> RiskFactors { get; set; } = new();
    public Dictionary<string, double> ExpectedMetrics { get; set; } = new();
}

public class RiskMitigation
{
    public string RiskType { get; set; } = string.Empty;
    public string MitigationStrategy { get; set; } = string.Empty;
    public double EffectivenessScore { get; set; }
}

public class MetricAlert
{
    public string MetricName { get; set; } = string.Empty;
    public double CurrentValue { get; set; }
    public double ThresholdValue { get; set; }
    public string AlertType { get; set; } = string.Empty; // warning, critical
    public string Message { get; set; } = string.Empty;
}
