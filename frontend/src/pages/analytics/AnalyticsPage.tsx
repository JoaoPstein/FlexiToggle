import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Activity,
  Download,
  RefreshCw,
  Eye,
  Target,
  Zap,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import type { SelectOption } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { apiService } from '../../services/api';
import type { Project } from '../../types';
import { cn } from '../../utils/cn';

interface AnalyticsData {
  flagUsage: Array<{
    flagKey: string;
    evaluations: number;
    uniqueUsers: number;
    environment: string;
    date: string;
    successRate: number;
  }>;
  userEngagement: Array<{
    date: string;
    activeUsers: number;
    newUsers: number;
    returningUsers: number;
    evaluations: number;
  }>;
  performance: Array<{
    date: string;
    avgResponseTime: number;
    evaluations: number;
    errorRate: number;
    p95ResponseTime: number;
  }>;
  flagTrends: Array<{
    date: string;
    enabled: number;
    disabled: number;
    total: number;
  }>;
}

export const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { addToast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedProject, selectedPeriod]);

  const loadProjects = async () => {
    try {
      const projectsData = await apiService.getProjects();
      setProjects(projectsData);
      
      if (!selectedProject && projectsData.length > 0) {
        setSelectedProject(projectsData[0].Id.toString());
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar projetos',
        message: 'Não foi possível carregar a lista de projetos'
      });
    }
  };

  const generateMockData = (): AnalyticsData => {
    const days = parseInt(selectedPeriod);
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return date.toISOString().split('T')[0];
    });

    // Mock flag usage data
    const flagNames = ['user-onboarding', 'new-checkout', 'dark-mode', 'premium-features', 'mobile-redesign'];
    const flagUsage = flagNames.map((flagKey, index) => ({
      flagKey,
      evaluations: Math.floor(Math.random() * 5000) + 1000,
      uniqueUsers: Math.floor(Math.random() * 1000) + 200,
      environment: 'production',
      date: dates[Math.floor(Math.random() * dates.length)],
      successRate: 95 + Math.random() * 4
    }));

    // Mock user engagement data
    const userEngagement = dates.map(date => ({
      date,
      activeUsers: Math.floor(Math.random() * 2000) + 500,
      newUsers: Math.floor(Math.random() * 300) + 50,
      returningUsers: Math.floor(Math.random() * 1700) + 450,
      evaluations: Math.floor(Math.random() * 10000) + 2000
    }));

    // Mock performance data
    const performance = dates.map(date => ({
      date,
      avgResponseTime: Math.floor(Math.random() * 50) + 15,
      evaluations: Math.floor(Math.random() * 10000) + 2000,
      errorRate: Math.random() * 2,
      p95ResponseTime: Math.floor(Math.random() * 100) + 50
    }));

    // Mock flag trends
    const flagTrends = dates.map(date => {
      const total = Math.floor(Math.random() * 20) + 10;
      const enabled = Math.floor(total * (0.6 + Math.random() * 0.3));
      return {
        date,
        enabled,
        disabled: total - enabled,
        total
      };
    });

    return {
      flagUsage,
      userEngagement,
      performance,
      flagTrends
    };
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // For now, use mock data since the API might not have analytics endpoint
      // In a real scenario, you would call: await apiService.getAnalytics(projectId, environmentId, period)
      const mockData = generateMockData();
      setAnalytics(mockData);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Fallback to mock data
      const mockData = generateMockData();
      setAnalytics(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Calculate key metrics
  const { totalEvaluations, totalUsers, avgResponseTime, avgErrorRate, totalFlags, activeFlags } = useMemo(() => {
    if (!analytics) {
      return {
        totalEvaluations: 0,
        totalUsers: 0,
        avgResponseTime: 0,
        avgErrorRate: 0,
        totalFlags: 0,
        activeFlags: 0
      };
    }

    const evaluations = analytics.userEngagement.reduce((sum, item) => sum + item.evaluations, 0);
    const users = analytics.userEngagement.reduce((sum, item) => sum + item.activeUsers, 0);
    const responseTimeSum = analytics.performance.reduce((sum, item) => sum + item.avgResponseTime, 0);
    const errorRateSum = analytics.performance.reduce((sum, item) => sum + item.errorRate, 0);
    
    const latestTrend = analytics.flagTrends[analytics.flagTrends.length - 1];
    
    return {
      totalEvaluations: evaluations,
      totalUsers: Math.floor(users / analytics.userEngagement.length),
      avgResponseTime: Math.floor(responseTimeSum / analytics.performance.length),
      avgErrorRate: errorRateSum / analytics.performance.length,
      totalFlags: latestTrend?.total || 0,
      activeFlags: latestTrend?.enabled || 0
    };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Monitore o desempenho e uso das suas feature flags em tempo real
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={loadData}
              disabled={isLoading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Atualizar
            </Button>
            <Button variant="outline" className="bg-white text-purple-600">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">Projeto</label>
              <Select
                placeholder="Selecione um projeto"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                options={[
                  { value: '', label: 'Todos os projetos' },
                  ...projects.map(p => ({ value: p.Id.toString(), label: p.Name }))
                ] as SelectOption[]}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                options={[
                  { value: '7', label: 'Últimos 7 dias' },
                  { value: '30', label: 'Últimos 30 dias' },
                  { value: '90', label: 'Últimos 90 dias' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Avaliações</p>
                <p className="text-3xl font-bold text-gray-900">{totalEvaluations.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">↗ +12% vs período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">↗ +8% vs período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                <p className="text-3xl font-bold text-gray-900">{avgResponseTime}ms</p>
                <p className="text-xs text-green-600 mt-1">↘ -5% vs período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-3xl font-bold text-gray-900">{(100 - avgErrorRate).toFixed(1)}%</p>
                <p className="text-xs text-green-600 mt-1">↗ +0.2% vs período anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Evaluations Trend */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Tendência de Avaliações
            </CardTitle>
            <CardDescription>
              Número de avaliações ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.userEngagement || []}>
                  <defs>
                    <linearGradient id="colorEvaluations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    formatter={(value: any) => [value.toLocaleString(), 'Avaliações']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="evaluations" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEvaluations)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Flag Usage Distribution */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
              Uso por Feature Flag
            </CardTitle>
            <CardDescription>
              Distribuição de avaliações por flag
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.flagUsage || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="flagKey" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value: any) => [value.toLocaleString(), 'Avaliações']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Bar dataKey="evaluations" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Engagement */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Engajamento de Usuários
            </CardTitle>
            <CardDescription>
              Usuários novos vs recorrentes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.userEngagement || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="newUsers" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Novos Usuários"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="returningUsers" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Usuários Recorrentes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-100">
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-600" />
              Performance
            </CardTitle>
            <CardDescription>
              Tempo de resposta e taxa de erro
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.performance || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                    stroke="#6b7280"
                  />
                  <YAxis yAxisId="left" stroke="#6b7280" />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgResponseTime" 
                    stroke="#F59E0B" 
                    strokeWidth={3}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                    name="Tempo de Resposta (ms)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    name="Taxa de Erro (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flag Status Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-emerald-600" />
              Status das Flags
            </CardTitle>
            <CardDescription>
              Distribuição atual das feature flags
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Ativas', value: activeFlags, color: '#10B981' },
                      { name: 'Inativas', value: totalFlags - activeFlags, color: '#EF4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <CardTitle>Top Feature Flags</CardTitle>
            <CardDescription>
              Flags com maior número de avaliações
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {analytics?.flagUsage.slice(0, 5).map((flag, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{flag.flagKey}</h4>
                      <p className="text-sm text-gray-600">
                        {flag.evaluations.toLocaleString()} avaliações • {flag.uniqueUsers.toLocaleString()} usuários únicos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {flag.successRate.toFixed(1)}% sucesso
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};