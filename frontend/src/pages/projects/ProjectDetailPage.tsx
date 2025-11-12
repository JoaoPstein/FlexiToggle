import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Users, 
  Key, 
  BarChart3, 
  Flag,
  Plus,
  Copy,
  Eye,
  Trash2,
  AlertTriangle,
  Sparkles,
  Globe,
  Activity,
  Code,
  Shield,
  Zap,
  Calendar,
  UserCheck,
  Database,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { apiService } from '../../services/api';
import type { Project, FeatureFlag } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'flags' | 'settings' | 'members' | 'apikeys'>(
    (searchParams.get('tab') as any) || 'overview'
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ Name: '', Description: '' });
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ Email: '', Role: 'Developer' });
  const [isCreateApiKeyModalOpen, setIsCreateApiKeyModalOpen] = useState(false);
  const [apiKeyForm, setApiKeyForm] = useState({ name: '', environmentId: 0 });
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      const [projectData, flagsData] = await Promise.all([
        apiService.getProject(projectId!),
        apiService.getFeatureFlags(parseInt(projectId!))
      ]);
      
      setProject(projectData);
      setFeatureFlags(flagsData);
    } catch (error) {
      console.error('Error loading project:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar projeto',
        message: 'Não foi possível carregar os dados do projeto'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      addToast({
        type: 'success',
        title: 'API Key copiada',
        message: 'API Key copiada para a área de transferência'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao copiar',
        message: 'Não foi possível copiar a API Key'
      });
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;
    setDeleteConfirmText('');
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (!project || deleteConfirmText !== project.Name) return;
    
    try {
      await apiService.deleteProject(project.Id.toString());
      addToast({
        type: 'success',
        title: 'Projeto excluído',
        message: 'Projeto excluído com sucesso'
      });
      navigate('/projects');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao excluir projeto',
        message: 'Não foi possível excluir o projeto'
      });
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteConfirmText('');
    }
  };

  const handleEditProject = () => {
    if (!project) return;
    setEditForm({
      Name: project.Name,
      Description: project.Description || ''
    });
    setIsEditing(true);
  };

  const handleSaveProject = async () => {
    if (!project) return;
    
    try {
      const updatedProject = await apiService.updateProject(project.Id.toString(), {
        Name: editForm.Name,
        Description: editForm.Description
      });
      setProject(updatedProject);
      setIsEditing(false);
      addToast({
        type: 'success',
        title: 'Projeto atualizado',
        message: 'Projeto atualizado com sucesso'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao atualizar projeto',
        message: 'Não foi possível atualizar o projeto'
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ Name: '', Description: '' });
  };

  const handleCreateApiKey = async () => {
    if (!project || !apiKeyForm.name) return;
    
    try {
      const response = await apiService.createApiKey(
        project.Id.toString(), 
        apiKeyForm.environmentId.toString(), 
        { name: apiKeyForm.name, type: 0 }
      );
      
      // Mostrar a chave completa na modal
      setCreatedApiKey(response.Key);
      
      addToast({
        type: 'success',
        title: 'API Key criada',
        message: 'API Key criada com sucesso'
      });
      
      // Recarregar dados do projeto
      loadProjectData();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao criar API Key',
        message: 'Não foi possível criar a API Key'
      });
    }
  };

  const openCreateApiKeyModal = (environmentId: number) => {
    setApiKeyForm({ name: '', environmentId });
    setCreatedApiKey(null);
    setIsCreateApiKeyModalOpen(true);
  };

  const closeApiKeyModal = () => {
    setIsCreateApiKeyModalOpen(false);
    setApiKeyForm({ name: '', environmentId: 0 });
    setCreatedApiKey(null);
  };

  const copyApiKeyToClipboard = async () => {
    if (createdApiKey) {
      try {
        await navigator.clipboard.writeText(createdApiKey);
        addToast({
          type: 'success',
          title: 'API Key copiada',
          message: 'API Key copiada para a área de transferência'
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao copiar',
          message: 'Não foi possível copiar a API Key'
        });
      }
    }
  };

  const handleAddMember = async () => {
    if (!project) return;
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberForm.Email)) {
      addToast({
        type: 'error',
        title: 'Email inválido',
        message: 'Por favor, digite um email válido'
      });
      return;
    }
    
    try {
      await apiService.addProjectMember(project.Id.toString(), { 
        email: memberForm.Email, 
        role: memberForm.Role 
      });
      addToast({
        type: 'success',
        title: 'Membro adicionado',
        message: 'Membro adicionado com sucesso'
      });
      setIsAddMemberModalOpen(false);
      setMemberForm({ Email: '', Role: 'Developer' });
      loadProjectData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.errors?.Email?.[0] || 
                          error.response?.data?.message || 
                          'Não foi possível adicionar o membro';
      addToast({
        type: 'error',
        title: 'Erro ao adicionar membro',
        message: errorMessage
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;
    
    const confirmed = window.confirm('Tem certeza que deseja remover este membro?');
    if (!confirmed) return;
    
    try {
      await apiService.removeProjectMember(project.Id.toString(), memberId);
      addToast({
        type: 'success',
        title: 'Membro removido',
        message: 'Membro removido com sucesso'
      });
      loadProjectData();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao remover membro',
        message: 'Não foi possível remover o membro'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Projeto não encontrado</h2>
          <Button onClick={() => navigate('/projects')}>
            Voltar para Projetos
          </Button>
        </div>
      </div>
    );
  }

  const renderOverview = () => {
    const activeFlags = featureFlags.filter(f => !f.IsArchived).length;
    const totalApiKeys = project.Environments.reduce((acc, env) => acc + (env.ApiKeys?.length || 0), 0);
    
    return (
      <div className="space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/20 rounded-full blur-xl -translate-y-10 translate-x-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Feature Flags</p>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-3xl font-bold text-gray-900">{featureFlags.length}</div>
                    <div className="text-sm text-emerald-600 font-medium">
                      {activeFlags} ativas
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors">
                  <Flag className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${featureFlags.length > 0 ? (activeFlags / featureFlags.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-gray-500">
                  {featureFlags.length > 0 ? Math.round((activeFlags / featureFlags.length) * 100) : 0}%
                </span>
              </div>
          </CardContent>
        </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-cyan-50/30 to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full blur-xl -translate-y-10 translate-x-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Ambientes</p>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-3xl font-bold text-gray-900">{project.Environments.length}</div>
                    <div className="text-sm text-blue-600 font-medium">configurados</div>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Activity className="h-3 w-3" />
                  <span>Todos os ambientes ativos</span>
                </div>
              </div>
          </CardContent>
        </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-teal-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl -translate-y-10 translate-x-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Membros</p>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-3xl font-bold text-gray-900">{project.Members?.length || 1}</div>
                    <div className="text-sm text-emerald-600 font-medium">colaboradores</div>
                  </div>
                </div>
                <div className="p-3 bg-emerald-100 rounded-2xl group-hover:bg-emerald-200 transition-colors">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <UserCheck className="h-3 w-3" />
                  <span>Equipe colaborativa</span>
                </div>
              </div>
          </CardContent>
        </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/20 rounded-full blur-xl -translate-y-10 translate-x-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">API Keys</p>
                  <div className="flex items-baseline space-x-2">
                    <div className="text-3xl font-bold text-gray-900">{totalApiKeys}</div>
                    <div className="text-sm text-orange-600 font-medium">ativas</div>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-2xl group-hover:bg-orange-200 transition-colors">
                  <Key className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Shield className="h-3 w-3" />
                  <span>Acesso seguro</span>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feature Flags */}
        <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-blue-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Flag className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-bold">Feature Flags Recentes</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/feature-flags')}
                className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
              >
                Ver Todas
              </Button>
            </div>
        </CardHeader>
          
          <CardContent className="relative">
          {featureFlags.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                  <Flag className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Primeira Feature Flag
              </h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Crie sua primeira feature flag para começar a controlar funcionalidades em tempo real
              </p>
                <Button 
                  onClick={() => navigate('/feature-flags')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                <Plus className="h-4 w-4 mr-2" />
                Criar Feature Flag
                  <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
                {featureFlags.slice(0, 5).map((flag, index) => {
                  const isActive = !flag.IsArchived;
                  return (
                    <div 
                      key={flag.Id} 
                      className="group/item flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isActive ? <Zap className="h-5 w-5" /> : <Flag className="h-5 w-5" />}
                        </div>
                  <div>
                          <h4 className="font-semibold text-gray-900 group-hover/item:text-blue-600 transition-colors">
                            {flag.Name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{flag.Description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Code className="h-3 w-3" />
                              <span>{flag.Key}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Database className="h-3 w-3" />
                              <span>{flag.Type}</span>
                            </span>
                          </div>
                        </div>
                  </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isActive 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {isActive ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1 inline" />
                              ATIVA
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1 inline" />
                              ARQUIVADA
                            </>
                          )}
                    </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/feature-flags')}
                          className="opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                {featureFlags.length > 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/feature-flags')}
                      className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                    >
                      Ver mais {featureFlags.length - 5} feature flags
                    </Button>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Configurações do Projeto</CardTitle>
          {!isEditing && (
            <Button onClick={handleEditProject}>
              Editar Projeto
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Projeto
            </label>
            <input
              type="text"
              value={isEditing ? editForm.Name : project.Name}
              onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, Name: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              readOnly={!isEditing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave do Projeto
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={project.Key}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                readOnly
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyApiKey(project.Key)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              A chave do projeto não pode ser alterada
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={isEditing ? editForm.Description : (project.Description || '')}
              onChange={(e) => isEditing && setEditForm(prev => ({ ...prev, Description: e.target.value }))}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                isEditing ? 'bg-white' : 'bg-gray-50'
              }`}
              rows={3}
              readOnly={!isEditing}
            />
          </div>

          {isEditing && (
            <div className="flex space-x-4 pt-4">
              <Button onClick={handleSaveProject}>
                Salvar Alterações
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={handleDeleteProject}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Projeto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderApiKeys = () => (
    <div className="space-y-6">
      {project.Environments.map((env) => (
        <Card key={env.Id}>
          <CardHeader>
            <CardTitle>{env.Name} - API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {env.ApiKeys && env.ApiKeys.length > 0 ? (
              <div className="space-y-4">
                {env.ApiKeys.map((apiKey) => (
                  <div key={apiKey.Id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{apiKey.Name}</h4>
                      <p className="text-sm text-gray-500">
                        Criada em {new Date(apiKey.CreatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {apiKey.KeyPrefix}...
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyApiKey(apiKey.KeyPrefix)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma API Key configurada
                </h3>
                <p className="text-gray-500 mb-4">
                  Crie uma API Key para acessar este ambiente
                </p>
                <Button onClick={() => openCreateApiKeyModal(env.Id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar API Key
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Membros do Projeto</CardTitle>
                <Button onClick={() => setIsAddMemberModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
        </CardHeader>
        <CardContent>
          {project.Members && project.Members.length > 0 ? (
            <div className="space-y-4">
              {project.Members.map((member) => (
                <div key={member.Id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{member.User.Name}</h4>
                      <p className="text-sm text-gray-500">{member.User.Email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.Role === 'Owner' ? 'bg-purple-100 text-purple-600' :
                      member.Role === 'Admin' ? 'bg-red-100 text-red-600' :
                      member.Role === 'Developer' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {member.Role}
                    </span>
                    {member.Role !== 'Owner' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveMember(member.Id.toString())}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum membro encontrado
              </h3>
              <p className="text-gray-500 mb-4">
                Adicione membros para colaborar neste projeto
              </p>
              <Button onClick={() => setIsAddMemberModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Membro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-b-3xl"></div>
        <div className="absolute inset-0 bg-black/10 rounded-b-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-32 -translate-x-32"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/projects')}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Projetos
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/feature-flags')}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
              >
                <Flag className="h-4 w-4 mr-2" />
                Feature Flags
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => navigate('/feature-flags')}
                className="bg-white text-blue-600 hover:bg-white/90 shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Feature Flag
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white">
                    {project.Name}
                  </h1>
                  <p className="text-blue-100 text-lg mt-2">
                    {project.Description}
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90 text-sm font-medium">{featureFlags.length} Feature Flags</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-white/90 text-sm font-medium">{project.Environments.length} Ambientes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-white/90 text-sm font-medium">{project.Members?.length || 1} Membros</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-white/90 text-sm">Projeto criado em</div>
                <div className="text-white font-semibold">
                  {new Date(project.CreatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="relative -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-2">
          <nav className="flex space-x-2">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3, color: 'blue' },
              { id: 'flags', label: 'Feature Flags', icon: Flag, color: 'purple' },
              { id: 'settings', label: 'Configurações', icon: Settings, color: 'gray' },
              { id: 'members', label: 'Membros', icon: Users, color: 'emerald' },
              { id: 'apikeys', label: 'API Keys', icon: Key, color: 'orange' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/25`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 mr-2 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'apikeys' && renderApiKeys()}
        {activeTab === 'flags' && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Use a página de Feature Flags para gerenciar as flags deste projeto
            </p>
            <Button onClick={() => navigate('/feature-flags')} className="mt-4">
              Ir para Feature Flags
            </Button>
          </div>
        )}
        {activeTab === 'members' && renderMembers()}
      </div>

      {/* Add Member Modal */}
      <Modal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => {
          setIsAddMemberModalOpen(false);
          setMemberForm({ Email: '', Role: 'Developer' });
        }}
        title="Adicionar Membro"
      >
        <div className="space-y-4">
          <Input
            label="Email do membro"
            type="email"
            required
            value={memberForm.Email}
            onChange={(e) => setMemberForm(prev => ({ ...prev, Email: e.target.value }))}
            placeholder="usuario@exemplo.com"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Função
            </label>
            <select
              value={memberForm.Role}
              onChange={(e) => setMemberForm(prev => ({ ...prev, Role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Viewer">Viewer - Apenas visualização</option>
              <option value="Developer">Developer - Criar e editar flags</option>
              <option value="Admin">Admin - Gerenciar projeto</option>
              <option value="Owner">Owner - Controle total</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddMemberModalOpen(false);
                setMemberForm({ Email: '', Role: 'Developer' });
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={!memberForm.Email}
            >
              Adicionar Membro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create API Key Modal */}
      <Modal 
        isOpen={isCreateApiKeyModalOpen} 
        onClose={closeApiKeyModal}
        title={createdApiKey ? "API Key Criada" : "Criar API Key"}
      >
        {!createdApiKey ? (
          <div className="space-y-4">
            <Input
              label="Nome da API Key"
              required
              value={apiKeyForm.name}
              onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Produção Mobile App"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ambiente
              </label>
              <select
                value={apiKeyForm.environmentId}
                onChange={(e) => setApiKeyForm(prev => ({ ...prev, environmentId: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {project?.Environments.map(env => (
                  <option key={env.Id} value={env.Id}>
                    {env.Name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={closeApiKeyModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateApiKey}
                disabled={!apiKeyForm.name}
              >
                Criar API Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Eye className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Importante!
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Esta é a única vez que você verá a API Key completa. Copie-a agora e guarde em local seguro.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sua API Key
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={createdApiKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={copyApiKeyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={closeApiKeyModal}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Project Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title="Excluir Projeto"
      >
        <div className="space-y-6">
          {/* Warning Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Ação Irreversível
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Esta ação não pode ser desfeita. Todos os dados do projeto, incluindo feature flags, 
                  configurações e histórico serão permanentemente excluídos.
                </p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Projeto a ser excluído:</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Nome:</span> {project?.Name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Chave:</span> {project?.Key}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Ambientes:</span> {project?.Environments?.length || 0}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Membros:</span> {project?.Members?.length || 0}
              </p>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Para confirmar, digite o nome do projeto: <span className="font-mono bg-gray-100 px-1 rounded">{project?.Name}</span>
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={`Digite "${project?.Name}" para confirmar`}
              className="font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={confirmDeleteProject}
              disabled={deleteConfirmText !== project?.Name}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Projeto
            </Button>
          </div>
      </div>
      </Modal>
    </div>
  );
};
