import React, { useState } from 'react';
import { X, FlaskConical, Plus, Trash2, Save, Loader2, Target, BarChart3, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Card, CardContent } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  value: any;
  weight: number; // Percentage of traffic
  isControl: boolean;
}

interface ABTestMetric {
  id: string;
  name: string;
  type: 'conversion' | 'numeric' | 'duration';
  goal: 'increase' | 'decrease';
  description: string;
}

interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABTestVariant[];
  metrics: ABTestMetric[];
  trafficAllocation: number; // Percentage of users in the test
  duration: number; // Days
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
}

interface ABTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (abTest: ABTest) => void;
  flagName: string;
  flagType: string;
  initialTest?: ABTest;
}

export const ABTestingModal: React.FC<ABTestingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  flagName,
  flagType,
  initialTest
}) => {
  const [test, setTest] = useState<ABTest>(initialTest || {
    id: `test-${Date.now()}`,
    name: `${flagName} A/B Test`,
    description: '',
    hypothesis: '',
    variants: [
      {
        id: 'control',
        name: 'Control (A)',
        description: 'Versão atual',
        value: flagType === 'Boolean' ? false : '',
        weight: 50,
        isControl: true
      },
      {
        id: 'variant-b',
        name: 'Variant B',
        description: 'Nova versão',
        value: flagType === 'Boolean' ? true : '',
        weight: 50,
        isControl: false
      }
    ],
    metrics: [],
    trafficAllocation: 100,
    duration: 14,
    status: 'draft'
  });

  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const metricTypeOptions = [
    { value: 'conversion', label: 'Taxa de Conversão (%)' },
    { value: 'numeric', label: 'Valor Numérico' },
    { value: 'duration', label: 'Tempo/Duração' }
  ];

  const goalOptions = [
    { value: 'increase', label: 'Aumentar' },
    { value: 'decrease', label: 'Diminuir' }
  ];

  const addVariant = () => {
    const newVariant: ABTestVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${String.fromCharCode(65 + test.variants.length)}`,
      description: '',
      value: flagType === 'Boolean' ? true : '',
      weight: 0,
      isControl: false
    };

    setTest(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }));
  };

  const updateVariant = (id: string, updates: Partial<ABTestVariant>) => {
    setTest(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, ...updates } : v)
    }));
  };

  const removeVariant = (id: string) => {
    if (test.variants.length <= 2) {
      addToast({
        type: 'error',
        title: 'Erro',
        message: 'É necessário ter pelo menos 2 variantes'
      });
      return;
    }

    setTest(prev => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id)
    }));
  };

  const addMetric = () => {
    const newMetric: ABTestMetric = {
      id: `metric-${Date.now()}`,
      name: '',
      type: 'conversion',
      goal: 'increase',
      description: ''
    };

    setTest(prev => ({
      ...prev,
      metrics: [...prev.metrics, newMetric]
    }));
  };

  const updateMetric = (id: string, updates: Partial<ABTestMetric>) => {
    setTest(prev => ({
      ...prev,
      metrics: prev.metrics.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  const removeMetric = (id: string) => {
    setTest(prev => ({
      ...prev,
      metrics: prev.metrics.filter(m => m.id !== id)
    }));
  };

  const normalizeWeights = () => {
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) return;

    const normalizedVariants = test.variants.map(v => ({
      ...v,
      weight: Math.round((v.weight / totalWeight) * 100)
    }));

    setTest(prev => ({ ...prev, variants: normalizedVariants }));
  };

  const distributeWeightsEvenly = () => {
    const weight = Math.floor(100 / test.variants.length);
    const remainder = 100 - (weight * test.variants.length);

    const updatedVariants = test.variants.map((v, index) => ({
      ...v,
      weight: weight + (index < remainder ? 1 : 0)
    }));

    setTest(prev => ({ ...prev, variants: updatedVariants }));
  };

  const handleSave = async () => {
    // Validações
    if (!test.name.trim()) {
      addToast({
        type: 'error',
        title: 'Erro de validação',
        message: 'Nome do teste é obrigatório'
      });
      return;
    }

    if (test.variants.length < 2) {
      addToast({
        type: 'error',
        title: 'Erro de validação',
        message: 'É necessário ter pelo menos 2 variantes'
      });
      return;
    }

    if (test.metrics.length === 0) {
      addToast({
        type: 'error',
        title: 'Erro de validação',
        message: 'É necessário definir pelo menos 1 métrica'
      });
      return;
    }

    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      addToast({
        type: 'error',
        title: 'Erro de validação',
        message: 'A soma dos pesos das variantes deve ser 100%'
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(test);
      addToast({
        type: 'success',
        title: 'A/B Test configurado!',
        message: 'O teste foi criado com sucesso'
      });
      onClose();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Não foi possível salvar o teste A/B'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <FlaskConical className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">A/B Testing</h2>
            <p className="text-sm text-gray-500">Configure um teste A/B para "{flagName}"</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
        {/* Configurações Básicas */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Teste</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Teste"
                  value={test.name}
                  onChange={(e) => setTest(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Teste do Novo Checkout"
                  required
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Duração (dias)"
                    type="number"
                    min="1"
                    max="90"
                    value={test.duration}
                    onChange={(e) => setTest(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  />
                  
                  <Input
                    label="Tráfego (%)"
                    type="number"
                    min="1"
                    max="100"
                    value={test.trafficAllocation}
                    onChange={(e) => setTest(prev => ({ ...prev, trafficAllocation: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <Input
                label="Descrição"
                value={test.description}
                onChange={(e) => setTest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo do teste..."
              />

              <Input
                label="Hipótese"
                value={test.hypothesis}
                onChange={(e) => setTest(prev => ({ ...prev, hypothesis: e.target.value }))}
                placeholder="Ex: Acreditamos que o novo botão aumentará a conversão em 15%"
              />
            </div>
          </CardContent>
        </Card>

        {/* Variantes */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Variantes do Teste</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={distributeWeightsEvenly}
                >
                  Distribuir Igualmente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Variante
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {test.variants.map((variant, index) => (
                <div key={variant.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        variant.isControl 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                          className="font-medium"
                          placeholder="Nome da variante"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {variant.isControl && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Controle
                        </span>
                      )}
                      {!variant.isControl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Descrição"
                      value={variant.description}
                      onChange={(e) => updateVariant(variant.id, { description: e.target.value })}
                      placeholder="Descreva esta variante"
                    />
                    
                    <Input
                      label="Valor"
                      value={variant.value}
                      onChange={(e) => updateVariant(variant.id, { 
                        value: flagType === 'Boolean' ? e.target.value === 'true' : e.target.value 
                      })}
                      placeholder={flagType === 'Boolean' ? 'true/false' : 'Valor da variante'}
                    />
                    
                    <Input
                      label="Peso (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={variant.weight}
                      onChange={(e) => updateVariant(variant.id, { weight: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Total dos pesos:</span>
                <span className={`text-sm font-bold ${
                  totalWeight === 100 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalWeight}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Métricas de Sucesso</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addMetric}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Métrica
              </Button>
            </div>

            {test.metrics.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Nenhuma métrica definida</p>
                <Button onClick={addMetric}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar primeira métrica
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {test.metrics.map((metric) => (
                  <div key={metric.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Métrica de Sucesso</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeMetric(metric.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Input
                        label="Nome da Métrica"
                        value={metric.name}
                        onChange={(e) => updateMetric(metric.id, { name: e.target.value })}
                        placeholder="Ex: Taxa de Conversão"
                      />

                      <Select
                        label="Tipo"
                        value={metric.type}
                        onChange={(e) => updateMetric(metric.id, { type: e.target.value as any })}
                        options={metricTypeOptions}
                      />

                      <Select
                        label="Objetivo"
                        value={metric.goal}
                        onChange={(e) => updateMetric(metric.id, { goal: e.target.value as any })}
                        options={goalOptions}
                      />

                      <Input
                        label="Descrição"
                        value={metric.description}
                        onChange={(e) => updateMetric(metric.id, { description: e.target.value })}
                        placeholder="Como medir esta métrica"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-green-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Resumo do Teste
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Variantes:</p>
                <p className="text-gray-600">{test.variants.length} variantes configuradas</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Métricas:</p>
                <p className="text-gray-600">{test.metrics.length} métricas de sucesso</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-700">Duração:</p>
                <p className="text-gray-600">{test.duration} dias ({test.trafficAllocation}% do tráfego)</p>
              </div>
            </div>

            {test.hypothesis && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="font-medium text-gray-700 mb-1">Hipótese:</p>
                <p className="text-gray-600 italic">"{test.hypothesis}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isLoading || totalWeight !== 100}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Criar Teste A/B
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
};
