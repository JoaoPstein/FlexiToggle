import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Users, Clock, Target, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, CardContent } from '../ui/Card';
import { Select } from '../ui/Select';
import type { FeatureFlag } from '../../types';

interface AnalyticsData {
  evaluations: {
    total: number;
    enabled: number;
    disabled: number;
    trend: number; // percentage change
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    successRate: number;
  };
  users: {
    totalExposed: number;
    activeUsers: number;
    conversionRate: number;
  };
  environments: {
    [key: string]: {
      evaluations: number;
      enabled: number;
      users: number;
    };
  };
  timeline: Array<{
    date: string;
    evaluations: number;
    users: number;
    enabled: number;
  }>;
}

interface AdvancedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flag: FeatureFlag;
}

export const AdvancedAnalyticsModal: React.FC<AdvancedAnalyticsModalProps> = ({
  isOpen,
  onClose,
  flag
}) => {
  // Verificação de segurança
  if (!flag && isOpen) {
    return null;
  }

  const [timeRange, setTimeRange] = useState('7d');
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const timeRangeOptions = [
    { value: '1d', label: 'Últimas 24 horas' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' }
  ];

  const environmentOptions = [
    { value: 'all', label: 'Todos os ambientes' },
    ...(flag?.environments?.map(env => ({
      value: env.environment.id.toString(),
      label: env.environment.name
    })) || [])
  ];

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, timeRange, selectedEnvironment]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simular dados de analytics (em produção, viria da API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        evaluations: {
          total: Math.floor(Math.random() * 50000) + 10000,
          enabled: Math.floor(Math.random() * 30000) + 5000,
          disabled: Math.floor(Math.random() * 20000) + 3000,
          trend: (Math.random() - 0.5) * 40 // -20% to +20%
        },
        performance: {
          avgResponseTime: Math.random() * 50 + 10, // 10-60ms
          errorRate: Math.random() * 2, // 0-2%
          successRate: 98 + Math.random() * 2 // 98-100%
        },
        users: {
          totalExposed: Math.floor(Math.random() * 10000) + 2000,
          activeUsers: Math.floor(Math.random() * 5000) + 1000,
          conversionRate: Math.random() * 15 + 5 // 5-20%
        },
        environments: flag.environments.reduce((acc, env) => {
          acc[env.environment.name] = {
            evaluations: Math.floor(Math.random() * 10000) + 1000,
            enabled: Math.floor(Math.random() * 5000) + 500,
            users: Math.floor(Math.random() * 2000) + 200
          };
          return acc;
        }, {} as any),
        timeline: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          evaluations: Math.floor(Math.random() * 2000) + 500,
          users: Math.floor(Math.random() * 500) + 100,
          enabled: Math.floor(Math.random() * 1000) + 200
        }))
      };

      setAnalytics(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  if (!analytics && !isLoading) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Analytics Avançados</h2>
            <p className="text-sm text-gray-500">Métricas detalhadas para "{flag.name}"</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Select
              label="Período"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              options={timeRangeOptions}
            />
          </div>
          <div className="flex-1">
            <Select
              label="Ambiente"
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              options={environmentOptions}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Carregando analytics...</p>
            </div>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Avaliações</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics.evaluations.total)}
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className={`h-4 w-4 mr-1 ${
                          analytics.evaluations.trend >= 0 ? 'text-green-500' : 'text-red-500'
                        }`} />
                        <span className={`text-sm ${
                          analytics.evaluations.trend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {analytics.evaluations.trend >= 0 ? '+' : ''}{formatPercentage(analytics.evaluations.trend)}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Usuários Expostos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics.users.totalExposed)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatNumber(analytics.users.activeUsers)} ativos
                      </p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Taxa de Conversão</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(analytics.users.conversionRate)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Usuários que converteram
                      </p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tempo de Resposta</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.performance.avgResponseTime.toFixed(1)}ms
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatPercentage(analytics.performance.successRate)} sucesso
                      </p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Zap className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição Ativo/Inativo */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuição de Avaliações
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Feature Ativa</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatNumber(analytics.evaluations.enabled)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercentage((analytics.evaluations.enabled / analytics.evaluations.total) * 100)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(analytics.evaluations.enabled / analytics.evaluations.total) * 100}%` 
                      }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-400 rounded"></div>
                      <span className="text-sm font-medium text-gray-700">Feature Inativa</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        {formatNumber(analytics.evaluations.disabled)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercentage((analytics.evaluations.disabled / analytics.evaluations.total) * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance por Ambiente */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance por Ambiente
                </h3>
                <div className="space-y-4">
                  {Object.entries(analytics.environments).map(([envName, data]) => (
                    <div key={envName} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{envName}</h4>
                        <p className="text-sm text-gray-500">
                          {formatNumber(data.users)} usuários expostos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatNumber(data.evaluations)}
                        </p>
                        <p className="text-sm text-gray-500">avaliações</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline Simplificada */}
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tendência de Uso (Últimos 30 dias)
                </h3>
                <div className="h-32 flex items-end space-x-1">
                  {analytics.timeline.slice(-14).map((point, index) => {
                    const maxValue = Math.max(...analytics.timeline.map(p => p.evaluations));
                    const height = (point.evaluations / maxValue) * 100;
                    
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                        style={{ height: `${height}%` }}
                        title={`${point.date}: ${formatNumber(point.evaluations)} avaliações`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>14 dias atrás</span>
                  <span>Hoje</span>
                </div>
              </CardContent>
            </Card>

            {/* Insights e Recomendações */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💡 Insights e Recomendações
                </h3>
                <div className="space-y-3">
                  {analytics.performance.errorRate > 1 && (
                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Taxa de erro elevada ({formatPercentage(analytics.performance.errorRate)})
                        </p>
                        <p className="text-xs text-red-600">
                          Considere revisar a implementação da feature ou fazer rollback
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {analytics.users.conversionRate > 10 && (
                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Excelente taxa de conversão ({formatPercentage(analytics.users.conversionRate)})
                        </p>
                        <p className="text-xs text-green-600">
                          Considere expandir esta feature para mais usuários
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {analytics.evaluations.trend > 20 && (
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          Crescimento acelerado no uso (+{formatPercentage(analytics.evaluations.trend)})
                        </p>
                        <p className="text-xs text-blue-600">
                          Monitore a performance e capacidade do sistema
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};
