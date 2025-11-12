import React, { useState } from 'react';
import { X, Target, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';

interface TargetingRule {
  id: string;
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'gt' | 'lt' | 'startsWith' | 'endsWith';
  values: string[];
}

interface ActivationStrategy {
  id: string;
  name: string;
  type: 'percentage' | 'userIds' | 'attributes' | 'gradual';
  parameters: {
    percentage?: number;
    userIds?: string[];
    rules?: TargetingRule[];
    rolloutPercentage?: number;
  };
  isEnabled: boolean;
}

interface AdvancedTargetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (strategies: ActivationStrategy[]) => void;
  initialStrategies?: ActivationStrategy[];
  flagName: string;
}

export const AdvancedTargetingModal: React.FC<AdvancedTargetingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStrategies = [],
  flagName
}) => {
  const [strategies, setStrategies] = useState<ActivationStrategy[]>(initialStrategies);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const attributeOptions = [
    { value: 'userId', label: 'User ID' },
    { value: 'email', label: 'Email' },
    { value: 'region', label: 'Região' },
    { value: 'country', label: 'País' },
    { value: 'device', label: 'Dispositivo' },
    { value: 'browser', label: 'Navegador' },
    { value: 'version', label: 'Versão da App' },
    { value: 'plan', label: 'Plano de Assinatura' },
    { value: 'customAttribute', label: 'Atributo Customizado' }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Igual a' },
    { value: 'contains', label: 'Contém' },
    { value: 'in', label: 'Está em' },
    { value: 'gt', label: 'Maior que' },
    { value: 'lt', label: 'Menor que' },
    { value: 'startsWith', label: 'Começa com' },
    { value: 'endsWith', label: 'Termina com' }
  ];

  const strategyTypeOptions = [
    { value: 'percentage', label: 'Porcentagem de Usuários' },
    { value: 'userIds', label: 'IDs de Usuários Específicos' },
    { value: 'attributes', label: 'Baseado em Atributos' },
    { value: 'gradual', label: 'Rollout Gradual' }
  ];

  const addStrategy = () => {
    const newStrategy: ActivationStrategy = {
      id: `strategy-${Date.now()}`,
      name: `Estratégia ${strategies.length + 1}`,
      type: 'percentage',
      parameters: { percentage: 50 },
      isEnabled: true
    };
    setStrategies([...strategies, newStrategy]);
  };

  const updateStrategy = (id: string, updates: Partial<ActivationStrategy>) => {
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeStrategy = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
  };

  const addRule = (strategyId: string) => {
    const newRule: TargetingRule = {
      id: `rule-${Date.now()}`,
      attribute: 'userId',
      operator: 'equals',
      values: ['']
    };

    updateStrategy(strategyId, {
      parameters: {
        ...strategies.find(s => s.id === strategyId)?.parameters,
        rules: [
          ...(strategies.find(s => s.id === strategyId)?.parameters.rules || []),
          newRule
        ]
      }
    });
  };

  const updateRule = (strategyId: string, ruleId: string, updates: Partial<TargetingRule>) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    const updatedRules = strategy.parameters.rules?.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ) || [];

    updateStrategy(strategyId, {
      parameters: { ...strategy.parameters, rules: updatedRules }
    });
  };

  const removeRule = (strategyId: string, ruleId: string) => {
    const strategy = strategies.find(s => s.id === strategyId);
    if (!strategy) return;

    const updatedRules = strategy.parameters.rules?.filter(rule => rule.id !== ruleId) || [];
    updateStrategy(strategyId, {
      parameters: { ...strategy.parameters, rules: updatedRules }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(strategies);
      addToast({
        type: 'success',
        title: 'Estratégias salvas!',
        message: 'As estratégias de ativação foram configuradas com sucesso'
      });
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Não foi possível salvar as estratégias'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStrategyParameters = (strategy: ActivationStrategy) => {
    switch (strategy.type) {
      case 'percentage':
        return (
          <div className="space-y-4">
            <Input
              label="Porcentagem de usuários (%)"
              type="number"
              min="0"
              max="100"
              value={strategy.parameters.percentage || 0}
              onChange={(e) => updateStrategy(strategy.id, {
                parameters: { ...strategy.parameters, percentage: parseInt(e.target.value) }
              })}
            />
            <p className="text-sm text-gray-500">
              {strategy.parameters.percentage || 0}% dos usuários verão esta feature ativa
            </p>
          </div>
        );

      case 'userIds':
        return (
          <div className="space-y-4">
            <Input
              label="IDs de usuários (separados por vírgula)"
              placeholder="user1, user2, user3"
              value={strategy.parameters.userIds?.join(', ') || ''}
              onChange={(e) => updateStrategy(strategy.id, {
                parameters: { 
                  ...strategy.parameters, 
                  userIds: e.target.value.split(',').map(id => id.trim()).filter(Boolean)
                }
              })}
            />
            <p className="text-sm text-gray-500">
              Apenas os usuários especificados verão esta feature
            </p>
          </div>
        );

      case 'gradual':
        return (
          <div className="space-y-4">
            <Input
              label="Porcentagem atual do rollout (%)"
              type="number"
              min="0"
              max="100"
              value={strategy.parameters.rolloutPercentage || 0}
              onChange={(e) => updateStrategy(strategy.id, {
                parameters: { ...strategy.parameters, rolloutPercentage: parseInt(e.target.value) }
              })}
            />
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Rollout Gradual</h4>
              <p className="text-sm text-blue-700">
                Aumente gradualmente a porcentagem para liberar a feature progressivamente.
                Recomendado: 5% → 25% → 50% → 100%
              </p>
            </div>
          </div>
        );

      case 'attributes':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Regras de Segmentação</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addRule(strategy.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Regra
              </Button>
            </div>

            {strategy.parameters.rules?.map((rule) => (
              <div key={rule.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-700">Regra de Targeting</h5>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRule(strategy.id, rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Select
                    label="Atributo"
                    value={rule.attribute}
                    onChange={(e) => updateRule(strategy.id, rule.id, { attribute: e.target.value })}
                    options={attributeOptions}
                  />

                  <Select
                    label="Operador"
                    value={rule.operator}
                    onChange={(e) => updateRule(strategy.id, rule.id, { operator: e.target.value as any })}
                    options={operatorOptions}
                  />

                  <Input
                    label="Valores (separados por vírgula)"
                    placeholder="valor1, valor2"
                    value={rule.values.join(', ')}
                    onChange={(e) => updateRule(strategy.id, rule.id, {
                      values: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
                    })}
                  />
                </div>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  <strong>Exemplo:</strong> Se {rule.attribute} {rule.operator === 'equals' ? 'for igual a' : 
                    rule.operator === 'contains' ? 'contiver' : 
                    rule.operator === 'in' ? 'estiver em' : 
                    rule.operator === 'gt' ? 'for maior que' : 
                    rule.operator === 'lt' ? 'for menor que' : 
                    rule.operator === 'startsWith' ? 'começar com' : 'terminar com'} "{rule.values.join(' ou ')}", 
                  então a feature será ativa.
                </div>
              </div>
            )) || (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Nenhuma regra configurada</p>
                <Button
                  variant="outline"
                  onClick={() => addRule(strategy.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira regra
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Target className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Targeting Avançado</h2>
            <p className="text-sm text-gray-500">Configure estratégias de ativação para "{flagName}"</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Estratégias de Ativação</h3>
              <p className="text-sm text-gray-500">
                Configure como e para quem esta feature será ativada
              </p>
            </div>
            <Button onClick={addStrategy}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Estratégia
            </Button>
          </div>

          {strategies.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma estratégia configurada
              </h3>
              <p className="text-gray-500 mb-6">
                Adicione estratégias para controlar como esta feature será liberada
              </p>
              <Button onClick={addStrategy}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira estratégia
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {strategies.map((strategy, index) => (
                <div key={strategy.id} className="border border-gray-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <Input
                          value={strategy.name}
                          onChange={(e) => updateStrategy(strategy.id, { name: e.target.value })}
                          className="font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={strategy.isEnabled}
                          onChange={(e) => updateStrategy(strategy.id, { isEnabled: e.target.checked })}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Ativa</span>
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeStrategy(strategy.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Tipo de Estratégia"
                      value={strategy.type}
                      onChange={(e) => updateStrategy(strategy.id, { 
                        type: e.target.value as any,
                        parameters: {} // Reset parameters when type changes
                      })}
                      options={strategyTypeOptions}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    {renderStrategyParameters(strategy)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Estratégias
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};
