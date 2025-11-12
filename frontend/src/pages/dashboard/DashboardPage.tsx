import React, { useEffect, useState } from 'react';
import { 
  Flag, 
  FolderOpen, 
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Plus,
  Zap,
  Users,
  Eye,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import type { Project, FeatureFlag } from '../../types';
import { cn } from '../../utils/cn';
import { CreateFeatureFlagModal } from '../../components/features/CreateFeatureFlagModal';

interface DashboardStats {
  totalProjects: number;
  totalFlags: number;
  activeFlags: number;
  totalEvaluations: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalFlags: 0,
    activeFlags: 0,
    totalEvaluations: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentFlags, setRecentFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateFlagModalOpen, setIsCreateFlagModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load projects
      const projectsData = await apiService.getProjects();
      setProjects(projectsData);
      
      // Load flags from all projects
      let allFlags: FeatureFlag[] = [];
      for (const project of projectsData) {
        try {
          const projectFlags = await apiService.getFeatureFlags(project.Id);
          allFlags = [...allFlags, ...projectFlags];
        } catch (error) {
          console.error(`Error loading flags for project ${project.Id}:`, error);
        }
      }

      // Calculate stats
      const activeFlags = allFlags.filter(flag => 
        flag.Environments.some(env => env.IsEnabled)
      ).length;
      
      setStats({
        totalProjects: projectsData.length,
        totalFlags: allFlags.length,
        activeFlags,
        totalEvaluations: Math.floor(Math.random() * 10000) + 1000, // Mock data
      });

      // Set recent data (last 5)
      setRecentProjects(projectsData.slice(0, 5));
      setRecentFlags(allFlags.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      title: 'Projetos Ativos',
      value: stats.totalProjects,
      icon: FolderOpen,
      gradient: 'from-blue-600 to-blue-400',
      bgGradient: 'from-blue-50 to-blue-100',
      change: '+12%',
      changeType: 'positive' as const,
      description: 'vs. mês anterior'
    },
    {
      title: 'Feature Flags',
      value: stats.totalFlags,
      icon: Flag,
      gradient: 'from-emerald-600 to-emerald-400',
      bgGradient: 'from-emerald-50 to-emerald-100',
      change: '+8%',
      changeType: 'positive' as const,
      description: 'flags criadas'
    },
    {
      title: 'Flags Ativas',
      value: stats.activeFlags,
      icon: Zap,
      gradient: 'from-amber-600 to-amber-400',
      bgGradient: 'from-amber-50 to-amber-100',
      change: '+15%',
      changeType: 'positive' as const,
      description: 'em produção'
    },
    {
      title: 'Avaliações/Dia',
      value: stats.totalEvaluations.toLocaleString(),
      icon: Activity,
      gradient: 'from-purple-600 to-purple-400',
      bgGradient: 'from-purple-50 to-purple-100',
      change: '+23%',
      changeType: 'positive' as const,
      description: 'requests hoje'
    },
  ];

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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl"></div>
        <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-32 -translate-x-32"></div>
        
        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    Olá, {user?.Name?.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-blue-100 text-lg mt-2">
                    Bem-vindo ao FlexiToggle Dashboard
                  </p>
                </div>
              </div>
              <p className="text-white/90 text-lg max-w-2xl leading-relaxed">
                Gerencie suas feature flags, monitore métricas em tempo real e otimize a experiência dos seus usuários.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="secondary"
                size="lg"
                onClick={loadData}
                disabled={isLoading}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                icon={<RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />}
              >
                Atualizar Dados
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                className="bg-white text-blue-600 hover:bg-white/90 shadow-lg"
                onClick={() => setIsCreateFlagModalOpen(true)}
                disabled={projects.length === 0}
                icon={<Plus className="h-5 w-5" />}
              >
                Nova Feature Flag
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
            
            <CardContent className="relative p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className={`flex items-center space-x-1 text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
          
          <CardHeader className="relative border-b border-gray-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FolderOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Projetos Recentes</CardTitle>
                  <CardDescription className="text-gray-600">Seus projetos mais ativos</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                <Eye className="h-4 w-4 mr-2" />
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="relative p-6">
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <div key={project.Id} className="group/item flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {project.Name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover/item:text-blue-600 transition-colors">
                          {project.Name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{project.Description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(project.CreatedAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Globe className="h-3 w-3" />
                            <span>{project.Environments?.length || 0} ambientes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum projeto ainda</h3>
                <p className="text-gray-500 mb-6">Crie seu primeiro projeto para começar</p>
                <Button variant="primary" size="lg" icon={<Plus className="h-5 w-5" />}>
                  Criar Primeiro Projeto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Feature Flags */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 opacity-50"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
          
          <CardHeader className="relative border-b border-gray-100/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Flag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Feature Flags Recentes</CardTitle>
                  <CardDescription className="text-gray-600">Suas flags mais utilizadas</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50">
                <Target className="h-4 w-4 mr-2" />
                Gerenciar
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="relative p-6">
            {recentFlags.length > 0 ? (
              <div className="space-y-4">
                {recentFlags.map((flag, index) => {
                  const isActive = flag.Environments.some(env => env.IsEnabled);
                  const activeEnvs = flag.Environments.filter(env => env.IsEnabled).length;
                  const totalEnvs = flag.Environments.length;
                  
                  return (
                    <div key={flag.Id} className="group/item flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          isActive 
                            ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {isActive ? (
                            <Zap className="h-6 w-6 text-white" />
                          ) : (
                            <XCircle className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover/item:text-emerald-600 transition-colors">
                            {flag.Name}
                          </h4>
                          <p className="text-sm text-gray-500 font-mono mt-1">{flag.Key}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Globe className="h-3 w-3" />
                              <span>{activeEnvs}/{totalEnvs} ambientes ativos</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(flag.UpdatedAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {isActive ? 'ATIVO' : 'INATIVO'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-500">
                            {isActive ? 'Em produção' : 'Desabilitado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Flag className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma flag ainda</h3>
                <p className="text-gray-500 mb-6">Crie sua primeira feature flag</p>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => setIsCreateFlagModalOpen(true)}
                  disabled={projects.length === 0}
                  icon={<Plus className="h-5 w-5" />}
                >
                  Criar Primeira Flag
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Feature Flag Modal */}
      <CreateFeatureFlagModal
        isOpen={isCreateFlagModalOpen}
        onClose={() => setIsCreateFlagModalOpen(false)}
        onSuccess={() => {
          setIsCreateFlagModalOpen(false);
          loadData(); // Recarregar dados após criar flag
        }}
        projects={projects}
        selectedProjectId={projects.length > 0 ? projects[0].Id : undefined}
      />
    </div>
  );
};
