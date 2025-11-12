import React, { useState, useEffect } from 'react';
import { X, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface SmartRolloutConfig {
  id: string;
  name: string;
  strategy: 'conservative' | 'balanced' | 'aggressive' | 'custom';
  targetMetrics: {
    conversionRate: number;
    errorRate: number;
    responseTime: number;
    userSatisfaction: number;
  };
  rolloutSteps: RolloutStep[];
  aiOptimization: {
    enabled: boolean;
    learningRate: number;
    confidenceThreshold: number;
    autoRollback: boolean;
    maxRolloutSpeed: number;
  };
  safetyLimits: {
    maxErrorRate: number;
    maxResponseTime: number;
    minConversionRate: number;
    emergencyBrake: boolean;
  };
}

interface RolloutStep {
  id: string;
  percentage: number;
  duration: number; // minutes
  conditions: RolloutCondition[];
  aiRecommendation?: 'proceed' | 'pause' | 'rollback' | 'accelerate';
  actualMetrics?: {
    conversionRate: number;
    errorRate: number;
    responseTime: number;
    userCount: number;
  };
}

interface RolloutCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
  required: boolean;
}

interface SmartRolloutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: SmartRolloutConfig) => void;
  flagName: string;
  currentRollout?: SmartRolloutConfig;
}

export const SmartRolloutModal: React.FC<SmartRolloutModalProps> = ({
  isOpen,
  onClose,
  onSave,
  flagName,
  currentRollout
}) => {
  const [config, setConfig] = useState<SmartRolloutConfig>(currentRollout || {
    id: `rollout-${Date.now()}`,
    name: `Smart Rollout - ${flagName}`,
    strategy: 'balanced',
    targetMetrics: {
      conversionRate: 15.0,
      errorRate: 0.5,
      responseTime: 200,
      userSatisfaction: 4.5
    },
    rolloutSteps: [
      { id: 'step-1', percentage: 5, duration: 60, conditions: [] },
      { id: 'step-2', percentage: 25, duration: 120, conditions: [] },
      { id: 'step-3', percentage: 50, duration: 180, conditions: [] },
      { id: 'step-4', percentage: 100, duration: 240, conditions: [] }
    ],
    aiOptimization: {
      enabled: true,
      learningRate: 0.1,
      confidenceThreshold: 0.85,
      autoRollback: true,
      maxRolloutSpeed: 2.0
    },
    safetyLimits: {
      maxErrorRate: 2.0,
      maxResponseTime: 500,
      minConversionRate: 10.0,
      emergencyBrake: true
    }
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const { addToast } = useToast();

  const strategyOptions = [
    { value: 'conservative', label: '🐌 Conservativo - Rollout lento e seguro' },
    { value: 'balanced', label: '⚖️ Balanceado - Velocidade e segurança equilibradas' },
    { value: 'aggressive', label: '🚀 Agressivo - Rollout rápido com monitoramento' },
    { value: 'custom', label: '🎛️ Customizado - Configuração manual completa' }
  ];

  const applyStrategy = (strategy: string) => {
    const strategies = {
      conservative: {
        rolloutSteps: [
          { id: 'step-1', percentage: 1, duration: 120, conditions: [] },
          { id: 'step-2', percentage: 5, duration: 180, conditions: [] },
          { id: 'step-3', percentage: 15, duration: 240, conditions: [] },
          { id: 'step-4', percentage: 35, duration: 300, conditions: [] },
          { id: 'step-5', percentage: 65, duration: 360, conditions: [] },
          { id: 'step-6', percentage: 100, duration: 480, conditions: [] }
        ],
        aiOptimization: { ...config.aiOptimization, maxRolloutSpeed: 1.0 },
        safetyLimits: { ...config.safetyLimits, maxErrorRate: 1.0 }
      },
      balanced: {
        rolloutSteps: [
          { id: 'step-1', percentage: 5, duration: 60, conditions: [] },
          { id: 'step-2', percentage: 25, duration: 120, conditions: [] },
          { id: 'step-3', percentage: 50, duration: 180, conditions: [] },
          { id: 'step-4', percentage: 100, duration: 240, conditions: [] }
        ],
        aiOptimization: { ...config.aiOptimization, maxRolloutSpeed: 2.0 },
        safetyLimits: { ...config.safetyLimits, maxErrorRate: 2.0 }
      },
      aggressive: {
        rolloutSteps: [
          { id: 'step-1', percentage: 10, duration: 30, conditions: [] },
          { id: 'step-2', percentage: 50, duration: 60, conditions: [] },
          { id: 'step-3', percentage: 100, duration: 90, conditions: [] }
        ],
        aiOptimization: { ...config.aiOptimization, maxRolloutSpeed: 5.0 },
        safetyLimits: { ...config.safetyLimits, maxErrorRate: 3.0 }
      }
    };

    if (strategy !== 'custom') {
      const strategyConfig = strategies[strategy as keyof typeof strategies];
      setConfig(prev => ({
        ...prev,
        strategy: strategy as any,
        rolloutSteps: strategyConfig.rolloutSteps,
        aiOptimization: strategyConfig.aiOptimization,
        safetyLimits: strategyConfig.safetyLimits
      }));
    }
  };

  const runAISimulation = async () => {
    setIsSimulating(true);
    
    try {
      // Simular análise de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results = {
        predictedSuccess: Math.random() * 0.3 + 0.7, // 70-100%
        riskFactors: [
          { factor: 'Horário de pico', risk: 'medium', impact: 0.15 },
          { factor: 'Histórico de rollouts', risk: 'low', impact: 0.05 },
          { factor: 'Complexidade da feature', risk: 'high', impact: 0.25 }
        ],
        recommendations: [
          '🎯 Iniciar rollout durante horário de baixo tráfego',
          '📊 Monitorar métricas de performance nos primeiros 30 minutos',
          '🚨 Configurar alertas automáticos para taxa de erro > 1%',
          '⚡ Considerar rollout mais lento devido à complexidade da feature'
        ],
        optimizedSteps: config.rolloutSteps.map((step, index) => ({
          ...step,
          aiRecommendation: index === 0 ? 'proceed' : 
                           index === 1 ? 'proceed' :
                           index === 2 ? 'pause' : 'proceed',
          estimatedDuration: step.duration * (0.8 + Math.random() * 0.4)
        }))
      };
      
      setSimulationResults(results);
      
      addToast({
        type: 'success',
        title: 'Simulação IA Concluída',
        message: `Sucesso previsto: ${(results.predictedSuccess * 100).toFixed(1)}%`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro na Simulação',
        message: 'Não foi possível executar a simulação de IA'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSave = () => {
    onSave(config);
    addToast({
      type: 'success',
      title: 'Smart Rollout Configurado!',
      message: 'IA irá otimizar o rollout automaticamente'
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
            <Brain className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Smart Rollout com IA</h2>
            <p className="text-sm text-gray-500">Rollout inteligente e otimizado para "{flagName}"</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
        {/* Estratégia de Rollout */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Estratégia de Rollout
            </h3>
            
            <div className="space-y-4">
              <Select
                label="Estratégia Pré-definida"
                value={config.strategy}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, strategy: e.target.value as any }));
                  applyStrategy(e.target.value);
                }}
                options={strategyOptions}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="Taxa de Conversão Alvo (%)"
                  type="number"
                  step="0.1"
                  value={config.targetMetrics.conversionRate}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    targetMetrics: { ...prev.targetMetrics, conversionRate: parseFloat(e.target.value) }
                  }))}
                />
                
                <Input
                  label="Taxa de Erro Máx (%)"
                  type="number"
                  step="0.1"
                  value={config.targetMetrics.errorRate}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    targetMetrics: { ...prev.targetMetrics, errorRate: parseFloat(e.target.value) }
                  }))}
                />
                
                <Input
                  label="Tempo Resposta Máx (ms)"
                  type="number"
                  value={config.targetMetrics.responseTime}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    targetMetrics: { ...prev.targetMetrics, responseTime: parseInt(e.target.value) }
                  }))}
                />
                
                <Input
                  label="Satisfação Usuário"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={config.targetMetrics.userSatisfaction}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    targetMetrics: { ...prev.targetMetrics, userSatisfaction: parseFloat(e.target.value) }
                  }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuração de IA */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Otimização por IA
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.aiOptimization.enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      aiOptimization: { ...prev.aiOptimization, enabled: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Habilitar Otimização Automática por IA</span>
                </label>
              </div>

              {config.aiOptimization.enabled && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <Input
                    label="Taxa de Aprendizado"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1"
                    value={config.aiOptimization.learningRate}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      aiOptimization: { ...prev.aiOptimization, learningRate: parseFloat(e.target.value) }
                    }))}
                  />
                  
                  <Input
                    label="Confiança Mínima"
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="1"
                    value={config.aiOptimization.confidenceThreshold}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      aiOptimization: { ...prev.aiOptimization, confidenceThreshold: parseFloat(e.target.value) }
                    }))}
                  />
                  
                  <Input
                    label="Velocidade Máx (x)"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={config.aiOptimization.maxRolloutSpeed}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      aiOptimization: { ...prev.aiOptimization, maxRolloutSpeed: parseFloat(e.target.value) }
                    }))}
                  />
                  
                  <div className="flex items-center">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.aiOptimization.autoRollback}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          aiOptimization: { ...prev.aiOptimization, autoRollback: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Auto Rollback</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Simulação de IA */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Simulação Preditiva
              </h3>
              <Button
                onClick={runAISimulation}
                disabled={isSimulating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isSimulating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Simular com IA
                  </>
                )}
              </Button>
            </div>

            {simulationResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Sucesso Previsto</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {(simulationResults.predictedSuccess * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Fatores de Risco</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {simulationResults.riskFactors.length}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Recomendações</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {simulationResults.recommendations.length}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">🤖 Recomendações da IA:</h4>
                  <ul className="space-y-1">
                    {simulationResults.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Etapas do Rollout */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Etapas do Rollout Inteligente
            </h3>
            
            <div className="space-y-3">
              {config.rolloutSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500">Porcentagem</label>
                      <p className="font-medium">{step.percentage}%</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Duração</label>
                      <p className="font-medium">{step.duration} min</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">IA Recomenda</label>
                      <div className="flex items-center space-x-1">
                        {simulationResults?.optimizedSteps[index]?.aiRecommendation === 'proceed' && (
                          <><Play className="h-4 w-4 text-green-500" /><span className="text-green-600 text-sm">Prosseguir</span></>
                        )}
                        {simulationResults?.optimizedSteps[index]?.aiRecommendation === 'pause' && (
                          <><Pause className="h-4 w-4 text-yellow-500" /><span className="text-yellow-600 text-sm">Pausar</span></>
                        )}
                        {simulationResults?.optimizedSteps[index]?.aiRecommendation === 'rollback' && (
                          <><RotateCcw className="h-4 w-4 text-red-500" /><span className="text-red-600 text-sm">Rollback</span></>
                        )}
                        {!simulationResults && (
                          <span className="text-gray-400 text-sm">Execute simulação</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Brain className="h-4 w-4 mr-2" />
          Ativar Smart Rollout
        </Button>
      </div>
    </Modal>
  );
};
