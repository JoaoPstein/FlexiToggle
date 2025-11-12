import React, { useState, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Copy, Eye, Settings, Layers, Wand2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';

interface VisualRule {
  id: string;
  type: 'condition' | 'action' | 'logic';
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

interface VisualFlagConfig {
  id: string;
  name: string;
  description: string;
  rules: VisualRule[];
  defaultValue: any;
  environments: string[];
}

interface VisualFlagBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: VisualFlagConfig) => void;
  flagName: string;
  initialConfig?: VisualFlagConfig;
}

export const VisualFlagBuilder: React.FC<VisualFlagBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  flagName,
  initialConfig
}) => {
  const [config, setConfig] = useState<VisualFlagConfig>(initialConfig || {
    id: `visual-${Date.now()}`,
    name: flagName,
    description: '',
    rules: [],
    defaultValue: false,
    environments: ['development', 'staging', 'production']
  });

  const [selectedTool, setSelectedTool] = useState<string>('condition');
  const [draggedRule, setDraggedRule] = useState<VisualRule | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const ruleTypes = [
    {
      type: 'condition',
      icon: '🎯',
      label: 'Condição',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      description: 'Verifica atributos do usuário'
    },
    {
      type: 'logic',
      icon: '🔀',
      label: 'Lógica',
      color: 'bg-purple-100 border-purple-300 text-purple-800',
      description: 'Operadores AND, OR, NOT'
    },
    {
      type: 'action',
      icon: '⚡',
      label: 'Ação',
      color: 'bg-green-100 border-green-300 text-green-800',
      description: 'Resultado da flag'
    },
    {
      type: 'percentage',
      icon: '📊',
      label: 'Porcentagem',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      description: 'Rollout percentual'
    },
    {
      type: 'time',
      icon: '⏰',
      label: 'Tempo',
      color: 'bg-red-100 border-red-300 text-red-800',
      description: 'Condições temporais'
    },
    {
      type: 'geo',
      icon: '🌍',
      label: 'Geolocalização',
      color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      description: 'Baseado em localização'
    }
  ];

  const addRule = useCallback((type: string, position: { x: number; y: number }) => {
    const newRule: VisualRule = {
      id: `rule-${Date.now()}`,
      type: type as any,
      position,
      data: getDefaultRuleData(type),
      connections: []
    };

    setConfig(prev => ({
      ...prev,
      rules: [...prev.rules, newRule]
    }));
  }, []);

  const getDefaultRuleData = (type: string) => {
    switch (type) {
      case 'condition':
        return {
          attribute: 'userId',
          operator: 'equals',
          value: '',
          label: 'Nova Condição'
        };
      case 'logic':
        return {
          operator: 'AND',
          label: 'Operador Lógico'
        };
      case 'action':
        return {
          value: true,
          label: 'Resultado'
        };
      case 'percentage':
        return {
          percentage: 50,
          label: 'Rollout 50%'
        };
      case 'time':
        return {
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'UTC',
          label: 'Horário Comercial'
        };
      case 'geo':
        return {
          countries: ['US', 'BR'],
          label: 'Países Selecionados'
        };
      default:
        return { label: 'Nova Regra' };
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (selectedTool && selectedTool !== 'select') {
      addRule(selectedTool, position);
    }
  };

  const handleRuleUpdate = (ruleId: string, newData: any) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule =>
        rule.id === ruleId ? { ...rule, data: { ...rule.data, ...newData } } : rule
      )
    }));
  };

  const handleRuleDelete = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.filter(rule => rule.id !== ruleId)
    }));
  };

  const handleConnection = (fromId: string, toId: string) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(rule =>
        rule.id === fromId
          ? { ...rule, connections: [...rule.connections, toId] }
          : rule
      )
    }));
  };

  const generateCode = () => {
    // Gerar código baseado nas regras visuais
    const code = `
// Código gerado automaticamente pelo Visual Flag Builder
function evaluateFlag(user, context) {
  ${config.rules.map(rule => {
    switch (rule.type) {
      case 'condition':
        return `  // ${rule.data.label}
  if (user.${rule.data.attribute} ${rule.data.operator} "${rule.data.value}") {`;
      case 'action':
        return `    return ${JSON.stringify(rule.data.value)};
  }`;
      default:
        return `  // ${rule.data.label}`;
    }
  }).join('\n')}
  
  return ${JSON.stringify(config.defaultValue)};
}`;

    navigator.clipboard.writeText(code);
    addToast({
      type: 'success',
      title: 'Código Copiado!',
      message: 'Código JavaScript foi copiado para a área de transferência'
    });
  };

  const autoArrange = () => {
    // Auto-organizar regras em um layout inteligente
    const arrangedRules = config.rules.map((rule, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      return {
        ...rule,
        position: {
          x: 50 + col * 200,
          y: 50 + row * 150
        }
      };
    });

    setConfig(prev => ({ ...prev, rules: arrangedRules }));
    
    addToast({
      type: 'success',
      title: 'Layout Otimizado!',
      message: 'Regras foram organizadas automaticamente'
    });
  };

  const renderRule = (rule: VisualRule) => {
    const ruleType = ruleTypes.find(t => t.type === rule.type);
    
    return (
      <div
        key={rule.id}
        className={`absolute p-4 rounded-lg border-2 shadow-lg cursor-move min-w-[180px] ${ruleType?.color || 'bg-gray-100 border-gray-300'}`}
        style={{
          left: rule.position.x,
          top: rule.position.y,
          transform: 'translate(-50%, -50%)'
        }}
        draggable
        onDragStart={(e) => {
          setDraggedRule(rule);
          e.dataTransfer.effectAllowed = 'move';
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{ruleType?.icon}</span>
            <span className="font-medium text-sm">{ruleType?.label}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsConnecting(!isConnecting)}
              className="p-1 hover:bg-white/50 rounded"
              title="Conectar"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleRuleDelete(rule.id)}
              className="p-1 hover:bg-white/50 rounded"
              title="Excluir"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {rule.type === 'condition' && (
            <>
              <Input
                placeholder="Atributo"
                value={rule.data.attribute}
                onChange={(e) => handleRuleUpdate(rule.id, { attribute: e.target.value })}
                className="text-xs"
              />
              <Select
                value={rule.data.operator}
                onChange={(e) => handleRuleUpdate(rule.id, { operator: e.target.value })}
                options={[
                  { value: 'equals', label: 'Igual a' },
                  { value: 'contains', label: 'Contém' },
                  { value: 'gt', label: 'Maior que' },
                  { value: 'lt', label: 'Menor que' }
                ]}
              />
              <Input
                placeholder="Valor"
                value={rule.data.value}
                onChange={(e) => handleRuleUpdate(rule.id, { value: e.target.value })}
                className="text-xs"
              />
            </>
          )}

          {rule.type === 'logic' && (
            <Select
              value={rule.data.operator}
              onChange={(e) => handleRuleUpdate(rule.id, { operator: e.target.value })}
              options={[
                { value: 'AND', label: 'E (AND)' },
                { value: 'OR', label: 'OU (OR)' },
                { value: 'NOT', label: 'NÃO (NOT)' }
              ]}
            />
          )}

          {rule.type === 'action' && (
            <div className="space-y-2">
              <Select
                value={typeof rule.data.value}
                onChange={(e) => {
                  const newValue = e.target.value === 'boolean' ? true : 
                                  e.target.value === 'string' ? '' : 0;
                  handleRuleUpdate(rule.id, { value: newValue });
                }}
                options={[
                  { value: 'boolean', label: 'Boolean' },
                  { value: 'string', label: 'String' },
                  { value: 'number', label: 'Number' }
                ]}
              />
              <Input
                placeholder="Valor de retorno"
                value={rule.data.value}
                onChange={(e) => {
                  let value = e.target.value;
                  if (typeof rule.data.value === 'boolean') {
                    value = value === 'true';
                  } else if (typeof rule.data.value === 'number') {
                    value = parseFloat(value) || 0;
                  }
                  handleRuleUpdate(rule.id, { value });
                }}
                className="text-xs"
              />
            </div>
          )}

          {rule.type === 'percentage' && (
            <Input
              type="number"
              min="0"
              max="100"
              placeholder="Porcentagem"
              value={rule.data.percentage}
              onChange={(e) => handleRuleUpdate(rule.id, { percentage: parseInt(e.target.value) })}
              className="text-xs"
            />
          )}
        </div>

        {/* Connection points */}
        <div className="absolute -right-2 top-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full transform -translate-y-1/2"></div>
        <div className="absolute -left-2 top-1/2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full transform -translate-y-1/2"></div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
            <Layers className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Visual Flag Builder</h2>
            <p className="text-sm text-gray-500">Construtor visual para "{flagName}"</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex h-[80vh]">
        {/* Toolbar */}
        <div className="w-64 border-r border-gray-200 p-4 space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">🛠️ Ferramentas</h3>
            <div className="space-y-2">
              {ruleTypes.map((tool) => (
                <button
                  key={tool.type}
                  onClick={() => setSelectedTool(tool.type)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    selectedTool === tool.type
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{tool.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{tool.label}</div>
                      <div className="text-xs text-gray-500">{tool.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">⚡ Ações</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={autoArrange}
                className="w-full justify-start"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto Organizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateCode}
                className="w-full justify-start"
              >
                <Copy className="h-4 w-4 mr-2" />
                Gerar Código
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Preview logic */}}
                className="w-full justify-start"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">📊 Estatísticas</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Regras: {config.rules.length}</div>
              <div>Conexões: {config.rules.reduce((acc, rule) => acc + rule.connections.length, 0)}</div>
              <div>Complexidade: {config.rules.length > 10 ? 'Alta' : config.rules.length > 5 ? 'Média' : 'Baixa'}</div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={canvasRef}
            className="w-full h-full bg-gradient-to-br from-gray-50 to-blue-50 relative cursor-crosshair"
            onClick={handleCanvasClick}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedRule && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const newPosition = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                };
                
                setConfig(prev => ({
                  ...prev,
                  rules: prev.rules.map(rule =>
                    rule.id === draggedRule.id
                      ? { ...rule, position: newPosition }
                      : rule
                  )
                }));
                setDraggedRule(null);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Grid background */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Rules */}
            {config.rules.map(renderRule)}

            {/* Connections */}
            <svg className="absolute inset-0 pointer-events-none">
              {config.rules.map(rule =>
                rule.connections.map(connectionId => {
                  const targetRule = config.rules.find(r => r.id === connectionId);
                  if (!targetRule) return null;

                  return (
                    <line
                      key={`${rule.id}-${connectionId}`}
                      x1={rule.position.x + 90}
                      y1={rule.position.y}
                      x2={targetRule.position.x - 90}
                      y2={targetRule.position.y}
                      stroke="#6366f1"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })
              )}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="#6366f1"
                  />
                </marker>
              </defs>
            </svg>

            {/* Empty state */}
            {config.rules.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Canvas Vazio
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Selecione uma ferramenta e clique para adicionar regras
                  </p>
                  <div className="text-sm text-gray-400">
                    💡 Dica: Use o Auto Organizar para layouts otimizados
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {config.rules.length} regras • {config.rules.reduce((acc, rule) => acc + rule.connections.length, 0)} conexões
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              onSave(config);
              addToast({
                type: 'success',
                title: 'Flag Visual Salva!',
                message: 'Configuração visual foi aplicada com sucesso'
              });
              onClose();
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Salvar Flag Visual
          </Button>
        </div>
      </div>
    </Modal>
  );
};
