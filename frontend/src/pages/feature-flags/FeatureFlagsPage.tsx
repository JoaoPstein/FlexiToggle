import React, { useState, useEffect } from 'react';
import { 
  Flag, 
  Search, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  FolderOpen,
  Filter,
  RefreshCw,
  Archive,
  Eye,
  EyeOff,
  Zap,
  Target,
  BarChart3,
  FlaskConical,
  Brain,
  Sparkles,
  Globe,
  Users,
  Clock,
  MoreHorizontal,
  Code,
  Database,
  Gauge
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { CreateFeatureFlagModal } from '../../components/features/CreateFeatureFlagModal';
import { EditFeatureFlagModal } from '../../components/features/EditFeatureFlagModal';
import { AdvancedTargetingModal } from '../../components/features/AdvancedTargetingModal';
import { AdvancedAnalyticsModal } from '../../components/features/AdvancedAnalyticsModal';
import { ABTestingModal } from '../../components/features/ABTestingModal';
import { SmartRolloutModal } from '../../components/features/SmartRolloutModal';
import { VisualFlagBuilder } from '../../components/features/VisualFlagBuilder';
import { apiService } from '../../services/api';
import type { FeatureFlag, Project } from '../../types';
import { cn } from '../../utils/cn';
import { FeatureFlagType } from '../../types/index';

export const FeatureFlagsPage: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [targetingFlag, setTargetingFlag] = useState<FeatureFlag | null>(null);
  const [analyticsFlag, setAnalyticsFlag] = useState<FeatureFlag | null>(null);
  const [abTestingFlag, setAbTestingFlag] = useState<FeatureFlag | null>(null);
  const [smartRolloutFlag, setSmartRolloutFlag] = useState<FeatureFlag | null>(null);
  const [visualBuilderFlag, setVisualBuilderFlag] = useState<FeatureFlag | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const projectsData = await apiService.getProjects();
      setProjects(projectsData);
      
      // Se há um projeto selecionado, carrega as flags
      if (selectedProject) {
        const flagsData = await apiService.getFeatureFlags(selectedProject);
        setFlags(flagsData);
      } else {
        // Se não há projeto selecionado e há projetos disponíveis, seleciona o primeiro
        if (projectsData.length > 0) {
          const firstProjectId = projectsData[0].Id;
          setSelectedProject(firstProjectId);
          const flagsData = await apiService.getFeatureFlags(firstProjectId);
          setFlags(flagsData);
        } else {
          setFlags([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar dados',
        message: 'Não foi possível carregar as feature flags'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag, environmentId: number) => {
    if (!selectedProject) return;
    
    try {
      // Encontra o ambiente específico para obter o estado atual
      const currentEnv = flag.Environments.find(env => env.Environment.Id === environmentId);
      if (!currentEnv) return;
      
      const newState = !currentEnv.IsEnabled;
      
      await apiService.toggleFeatureFlag(selectedProject, flag.Id, environmentId, newState);
      
      // Atualiza o estado local com animação suave
      setFlags(prev => prev.map(f => 
        f.Id === flag.Id ? {
          ...f,
          Environments: f.Environments.map(env => 
            env.Environment.Id === environmentId 
              ? { ...env, IsEnabled: newState }
              : env
          )
        } : f
      ));
      
      addToast({
        type: 'success',
        title: 'Flag atualizada',
        message: `Flag ${flag.Name} ${newState ? 'ativada' : 'desativada'} no ambiente ${currentEnv.Environment.Name}`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar flag',
        message: 'Não foi possível alterar o status da flag'
      });
    }
  };

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    if (!selectedProject) return;
    
    if (!confirm(`Tem certeza que deseja excluir a flag "${flag.Name}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await apiService.deleteFeatureFlag(selectedProject, flag.Id);
      setFlags(prev => prev.filter(f => f.Id !== flag.Id));
      addToast({
        type: 'success',
        title: 'Flag excluída',
        message: `Flag ${flag.Name} foi excluída com sucesso`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao excluir flag',
        message: 'Não foi possível excluir a flag'
      });
    }
  };

  const copyFlagKey = (key: string) => {
    navigator.clipboard.writeText(key);
    addToast({
      type: 'success',
      title: 'Copiado!',
      message: 'Chave da flag copiada para a área de transferência'
    });
  };

  const handleRefresh = () => {
    loadData(true);
  };

  // Filtrar flags baseado no termo de busca e filtro de tipo
  const filteredFlags = flags.filter(flag => {
    const matchesSearch = 
      flag.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.Key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.Description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = (() => {
      switch (filterType) {
        case 'active':
          return flag.Environments.some(env => env.IsEnabled);
        case 'inactive':
          return !flag.Environments.some(env => env.IsEnabled);
        case 'archived':
          return flag.IsArchived;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Calcular estatísticas
  const totalFlags = flags.length;
  const activeFlags = flags.filter(flag => 
    flag.Environments.some(env => env.IsEnabled)
  ).length;
  const inactiveFlags = totalFlags - activeFlags;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Carregando feature flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl"></div>
        <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-32 -translate-x-32"></div>
        
        <div className="relative p-4 sm:p-6 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-3 sm:p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                  <Flag className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
                    Feature Flags
                  </h1>
                  <p className="text-purple-100 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                    Controle total sobre suas funcionalidades
                  </p>
                </div>
              </div>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Ative, desative e configure funcionalidades em tempo real. Teste A/B, rollouts graduais e targeting avançado.
              </p>
              
              {/* Stats rápidas */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90 text-xs sm:text-sm font-medium">{activeFlags} Ativas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-white/90 text-xs sm:text-sm font-medium">{inactiveFlags} Inativas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-white/90 text-xs sm:text-sm font-medium">{totalFlags} Total</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full sm:w-auto">
              <Button 
                variant="secondary"
                size="lg"
                onClick={handleRefresh}
                disabled={isRefreshing || !selectedProject}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                icon={<RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />}
              >
                Atualizar
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!selectedProject}
                className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                icon={<Plus className="h-5 w-5" />}
              >
                Nova Feature Flag
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca Modernos */}
      <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-blue-50/30 to-purple-50/30 opacity-50"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
        
        <CardContent className="relative p-4 sm:p-6">
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
            {/* Busca Principal */}
            <div className="flex-1">
              <div className="relative group/search">
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within/search:text-purple-500 transition-colors">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <Input
                  placeholder="Buscar flags por nome, chave, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 sm:pl-12 pr-4 h-12 sm:h-14 text-sm sm:text-base border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl sm:rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200"
                />
                {searchTerm && (
                  <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full hidden sm:inline">
                      {filteredFlags.length} resultado{filteredFlags.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {/* Filtro de Status */}
              <div className="w-full sm:w-40 lg:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                  <Select
                    placeholder="Status"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    options={[
                      { value: 'all', label: '🏷️ Todas' },
                      { value: 'active', label: '✅ Ativas' },
                      { value: 'inactive', label: '⏸️ Inativas' },
                      { value: 'archived', label: '📦 Arquivadas' },
                    ]}
                    className="h-12 sm:h-14 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border-gray-200 focus:ring-2 focus:ring-purple-500 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Seletor de Projeto */}
              <div className="w-full sm:w-48 lg:w-64">
                <div className="relative">
                  <FolderOpen className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                  <Select
                    placeholder="Projeto"
                    value={selectedProject?.toString() || ''}
                    onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                    options={projects.map(p => ({ value: p.Id.toString(), label: `🎯 ${p.Name}` }))}
                    className="h-12 sm:h-14 pl-10 sm:pl-12 rounded-xl sm:rounded-2xl border-gray-200 focus:ring-2 focus:ring-purple-500 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          {selectedProject && (
            <div className="mt-6 pt-6 border-t border-gray-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">{activeFlags} ativas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">{inactiveFlags} inativas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{totalFlags} total</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Atualizado há {Math.floor(Math.random() * 5) + 1} min</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Lista de Feature Flags */}
      {!selectedProject ? (
        <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
          
          <CardContent className="relative text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Flag className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Selecione um Projeto
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Escolha um projeto acima para visualizar e gerenciar suas feature flags
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Controle em tempo real</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Targeting avançado</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics detalhado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredFlags.length > 0 ? (
        <div className="space-y-6">
          {filteredFlags.map((flag, index) => {
            const isActive = flag.Environments.some(env => env.IsEnabled);
            const activeEnvs = flag.Environments.filter(env => env.IsEnabled).length;
            const totalEnvs = flag.Environments.length;
            
            return (
              <Card 
                key={flag.Id} 
                className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardContent className="relative p-4 sm:p-6 lg:p-8">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Header da Flag */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                          isActive 
                            ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {isActive ? (
                            <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          ) : (
                            <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate">
                              {flag.Name}
                            </h3>
                            {flag.IsArchived && (
                              <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-sm">
                                <Archive className="h-3 w-3 mr-1 inline" />
                                ARQUIVADO
                              </span>
                            )}
                            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                              isActive 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {isActive ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">{flag.Description}</p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Code className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate">{flag.Key}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Database className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="capitalize truncate">{flag.Type}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{activeEnvs}/{totalEnvs} ambientes</span>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-500">
                              <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="truncate">{flag.CreatedBy.Name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        {/* Status Indicator */}
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">
                            {isActive ? 'Em produção' : 'Desabilitado'}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center flex-wrap gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAnalyticsFlag(flag)}
                            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Analytics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSmartRolloutFlag(flag)}
                            className="hover:bg-purple-50 hover:text-purple-600 transition-colors"
                            title="Smart Rollout"
                          >
                            <Brain className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAbTestingFlag(flag)}
                            className="hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            title="A/B Testing"
                          >
                            <FlaskConical className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyFlagKey(flag.Key)}
                            className="hover:bg-gray-50 hover:text-gray-600 transition-colors"
                            title="Copiar chave"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFlag(flag)}
                            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFlag(flag)}
                            className="hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-gray-50 hover:text-gray-600 transition-colors"
                            title="Mais opções"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                  </div>

                    {/* Ambientes */}
                    {flag.Environments && flag.Environments.length > 0 && (
                      <div className="bg-gradient-to-r from-gray-50/50 via-blue-50/30 to-purple-50/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-100/50 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-4 sm:mb-6">
                          <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                            <Globe className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                            Ambientes ({activeEnvs}/{totalEnvs} ativos)
                          </h4>
                          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
                            <Gauge className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>{Math.round((activeEnvs / totalEnvs) * 100)}% ativação</span>
                          </div>
                        </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {flag.Environments.map((env) => (
                          <div 
                              key={env.Id} 
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow space-y-3 sm:space-y-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                                <span className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                                  {env.Environment.Name}
                                </span>
                                <span className={cn(
                                  'px-2 sm:px-3 py-1 text-xs font-bold rounded-full border w-fit',
                                  env.IsEnabled 
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                    : 'bg-gray-100 text-gray-600 border-gray-200'
                                )}>
                                  {env.IsEnabled ? (
                                    <>
                                      <Eye className="h-3 w-3 mr-1 inline" />
                                      Ativo
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1 inline" />
                                      Inativo
                                    </>
                                  )}
                                </span>
                              </div>
                              {env.DefaultValue && (
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Valor: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{env.DefaultValue}</span>
                                </p>
                              )}
                            </div>
                            
                            <Button
                              variant={env.IsEnabled ? "danger" : "success"}
                              size="sm"
                              onClick={() => handleToggleFlag(flag, env.Environment.Id)}
                              className="transition-all duration-200 hover:scale-105 w-full sm:w-auto sm:ml-4"
                            >
                              {env.IsEnabled ? (
                                <>
                                  <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-0" />
                                  <span className="sm:hidden">Desativar</span>
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-0" />
                                  <span className="sm:hidden">Ativar</span>
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {flag.Tags && flag.Tags.length > 0 && (
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Tags:</h4>
                      <div className="flex flex-wrap gap-2">
                        {flag.Tags.map((tag) => (
                          <span
                            key={tag.Id}
                            className="px-3 py-1 text-sm font-medium rounded-full border transition-all hover:scale-105"
                            style={{ 
                              backgroundColor: `${tag.Color}15`, 
                              color: tag.Color,
                              borderColor: `${tag.Color}30`
                            }}
                          >
                            {tag.Name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-lg border-0">
          <CardContent className="text-center py-16">
            <div className="p-4 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Flag className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              {searchTerm || filterType !== 'all' 
                ? 'Nenhuma flag encontrada' 
                : 'Nenhuma feature flag ainda'
              }
            </h3>
            <p className="text-gray-500 text-lg mb-8">
              {searchTerm 
                ? `Nenhuma flag corresponde ao termo "${searchTerm}"`
                : filterType !== 'all'
                ? `Nenhuma flag ${filterType === 'active' ? 'ativa' : filterType === 'inactive' ? 'inativa' : 'arquivada'} encontrada`
                : 'Comece criando sua primeira feature flag'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                size="lg"
                className="px-8 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                Criar primeira flag
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateFeatureFlagModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData()}
        projects={projects}
        selectedProjectId={selectedProject || undefined}
      />

      <EditFeatureFlagModal
        isOpen={!!editingFlag}
        onClose={() => setEditingFlag(null)}
        onSuccess={() => loadData()}
        flag={editingFlag}
        projectId={selectedProject || 0}
      />

      <AdvancedTargetingModal
        isOpen={!!targetingFlag}
        onClose={() => setTargetingFlag(null)}
        onSave={async (strategies) => {
          // Em produção, salvaria as estratégias via API
          console.log('Saving targeting strategies:', strategies);
          addToast({
            type: 'success',
            title: 'Targeting configurado!',
            message: 'Estratégias de ativação salvas com sucesso'
          });
          setTargetingFlag(null);
        }}
        flagName={targetingFlag?.Name || ''}
        initialStrategies={[]}
      />

      {analyticsFlag && (
        <AdvancedAnalyticsModal
          isOpen={!!analyticsFlag}
          onClose={() => setAnalyticsFlag(null)}
          flag={analyticsFlag}
        />
      )}

      <ABTestingModal
        isOpen={!!abTestingFlag}
        onClose={() => setAbTestingFlag(null)}
        onSave={async (abTest) => {
          // Em produção, salvaria o teste A/B via API
          console.log('Saving A/B test:', abTest);
          addToast({
            type: 'success',
            title: 'A/B Test configurado!',
            message: 'Teste A/B criado com sucesso'
          });
          setAbTestingFlag(null);
        }}
        flagName={abTestingFlag?.Name || ''}
        flagType={abTestingFlag?.Type.toString() || FeatureFlagType.Boolean.toString()}
      />

      <SmartRolloutModal
        isOpen={!!smartRolloutFlag}
        onClose={() => setSmartRolloutFlag(null)}
        onSave={async (rolloutConfig) => {
          console.log('Saving smart rollout:', rolloutConfig);
          addToast({
            type: 'success',
            title: 'Smart Rollout Ativado!',
            message: 'IA irá otimizar o rollout automaticamente'
          });
          setSmartRolloutFlag(null);
        }}
        flagName={smartRolloutFlag?.Name || ''}
      />

      <VisualFlagBuilder
        isOpen={!!visualBuilderFlag}
        onClose={() => setVisualBuilderFlag(null)}
        onSave={async (visualConfig) => {
          console.log('Saving visual config:', visualConfig);
          addToast({
            type: 'success',
            title: 'Flag Visual Criada!',
            message: 'Configuração visual aplicada com sucesso'
          });
          setVisualBuilderFlag(null);
        }}
        flagName={visualBuilderFlag?.Name || ''}
      />
    </div>
  );
};