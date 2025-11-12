import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Settings, 
  RefreshCw,
  Sparkles,
  Users,
  Flag,
  Globe,
  Activity,
  ArrowUpRight,
  Target,
  Eye,
  Code,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { apiService } from '../../services/api';
import { generateProjectKey } from '../../utils/keyGenerator';
import type { Project } from '../../types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { addToast } = useToast();

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
      addToast({
        type: 'error',
        title: 'Erro ao carregar projetos',
        message: 'Não foi possível carregar os projetos'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl"></div>
        <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-32 -translate-x-32"></div>
        
        <div className="relative p-4 sm:p-6 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-3 sm:p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                  <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white">
                    Projetos
                  </h1>
                  <p className="text-emerald-100 text-sm sm:text-base lg:text-lg mt-1 sm:mt-2">
                    Organize e gerencie seus projetos
                  </p>
                </div>
              </div>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg max-w-2xl leading-relaxed">
                Centralize suas feature flags, gerencie ambientes e colabore com sua equipe em projetos organizados.
              </p>
              
              {/* Stats rápidas */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90 text-sm font-medium">{projects.length} Projetos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-white/90 text-sm font-medium">
                    {projects.reduce((acc, p) => acc + (p.Environments?.length || 0), 0)} Ambientes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-teal-400 rounded-full"></div>
                  <span className="text-white/90 text-sm font-medium">
                    {projects.reduce((acc, p) => acc + (p.FeatureFlagsCount || 0), 0)} Feature Flags
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="secondary"
                size="lg"
                onClick={loadProjects}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                icon={<RefreshCw className="h-5 w-5" />}
              >
                Atualizar
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white text-emerald-600 hover:bg-white/90 shadow-lg"
                icon={<Plus className="h-5 w-5" />}
              >
                Novo Projeto
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const envCount = project.Environments?.length || 0;
            const flagCount = project.FeatureFlagsCount || 0;
            const memberCount = project.Members?.length || 1;
            
            return (
              <Card 
                key={project.Id} 
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 overflow-hidden border-0 shadow-lg"
                onClick={() => navigate(`/projects/${project.Id}`)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-cyan-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="relative pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <FolderOpen className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2">
                          {project.Name}
                        </CardTitle>
                        <CardDescription className="text-gray-600 leading-relaxed">
                          {project.Description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.Id}?tab=settings`);
                      }}
                      className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                      title="Configurações"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-6">
                  {/* Métricas */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-2 mx-auto group-hover:bg-blue-200 transition-colors">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{envCount}</div>
                      <div className="text-xs text-gray-500">Ambientes</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-2 mx-auto group-hover:bg-purple-200 transition-colors">
                        <Flag className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{flagCount}</div>
                      <div className="text-xs text-gray-500">Flags</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-xl mb-2 mx-auto group-hover:bg-orange-200 transition-colors">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{memberCount}</div>
                      <div className="text-xs text-gray-500">Membros</div>
                    </div>
                  </div>
                  
                  {/* Informações adicionais */}
                  <div className="space-y-3 pt-4 border-t border-gray-100/50">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Code className="h-4 w-4" />
                        <span>Chave do projeto</span>
                      </div>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded group-hover:bg-emerald-100 transition-colors">
                        {project.Key}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Criado em</span>
                      </div>
                      <span className="text-gray-600">
                        {new Date(project.CreatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Activity className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                      <span className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-emerald-600 font-medium">Ativo</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Botão de ação */}
                  <div className="pt-4">
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:bg-emerald-50 group-hover:border-emerald-200 group-hover:text-emerald-600 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.Id}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                      <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 opacity-50"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
          
          <CardContent className="relative text-center py-20">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FolderOpen className="h-16 w-16 text-emerald-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Crie seu Primeiro Projeto
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto leading-relaxed">
              Organize suas feature flags em projetos para melhor controle e colaboração em equipe
            </p>
            
            <div className="flex items-center justify-center space-x-6 mb-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Organização inteligente</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Colaboração em equipe</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Controle granular</span>
              </div>
            </div>
            
            <Button 
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Projeto
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={loadProjects}
        />
      </div>
    );
  };

  // Create Project Modal Component
  interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }

  const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    onSuccess
  }) => {
    const [formData, setFormData] = useState({
      Name: '',
      Description: '',
      Key: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    // Generate key when modal opens or name changes
    const handleNameChange = (name: string) => {
      setFormData(prev => ({
        ...prev,
        Name: name,
        Key: generateProjectKey(name)
      }));
    };

    // Generate initial key when modal opens
    React.useEffect(() => {
      if (isOpen && !formData.Key) {
        setFormData(prev => ({
          ...prev,
          Key: generateProjectKey(prev.Name || undefined)
        }));
      }
    }, [isOpen]);

    const regenerateKey = () => {
      const newKey = generateProjectKey(formData.Name || undefined);
      setFormData(prev => ({ ...prev, Key: newKey }));
      addToast({
        type: 'success',
        title: 'Key regenerada',
        message: 'Nova key gerada com sucesso'
      });
    };

    const copyKey = async () => {
      try {
        await navigator.clipboard.writeText(formData.Key);
        addToast({
          type: 'success',
          title: 'Key copiada',
          message: 'Key copiada para a área de transferência'
        });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao copiar',
          message: 'Não foi possível copiar a key'
        });
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await apiService.createProject(formData);
        addToast({
          type: 'success',
          title: 'Projeto criado',
          message: 'Projeto criado com sucesso'
        });
        onSuccess();
        onClose();
        setFormData({ Name: '', Description: '', Key: '' });
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Erro ao criar projeto',
          message: 'Não foi possível criar o projeto'
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Novo Projeto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do projeto"
            required
            value={formData.Name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Nome do projeto"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chave do projeto *
            </label>
            <div className="flex space-x-2">
              <Input
                value={formData.Key}
                onChange={(e) => setFormData(prev => ({ ...prev, Key: e.target.value }))}
                placeholder="chave-do-projeto"
                className="flex-1"
                pattern="^[a-z0-9-_]+$"
                title="Apenas letras minúsculas, números, hífens e underscores"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={regenerateKey}
                title="Regenerar key"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyKey}
                title="Copiar key"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              A chave será usada na API e URLs. Gerada automaticamente, mas pode ser editada.
            </p>
          </div>
          
          <Input
            label="Descrição"
            value={formData.Description}
            onChange={(e) => setFormData(prev => ({ ...prev, Description: e.target.value }))}
            placeholder="Descrição do projeto (opcional)"
          />

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Criar Projeto
            </Button>
          </div>
        </form>
      </Modal>
    );
  };
