import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Key, 
  Database,
  Trash2,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'Developer'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    flagChanges: true,
    projectUpdates: true,
    systemAlerts: true
  });

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'danger', label: 'Zona de Perigo', icon: Trash2 }
  ];

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement API call
      addToast({
        type: 'success',
        title: 'Perfil atualizado',
        message: 'Suas informações foram salvas com sucesso'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Não foi possível atualizar o perfil'
      });
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Senhas não coincidem',
        message: 'A nova senha e confirmação devem ser iguais'
      });
      return;
    }

    try {
      // TODO: Implement API call
      addToast({
        type: 'success',
        title: 'Senha alterada',
        message: 'Sua senha foi alterada com sucesso'
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao alterar senha',
        message: 'Não foi possível alterar a senha'
      });
    }
  };

  const handleSaveNotifications = async () => {
    try {
      // TODO: Implement API call
      addToast({
        type: 'success',
        title: 'Configurações salvas',
        message: 'Suas preferências de notificação foram atualizadas'
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Não foi possível salvar as configurações'
      });
    }
  };

  const generateApiKey = () => {
    const key = 'fh_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    navigator.clipboard.writeText(key);
    addToast({
      type: 'success',
      title: 'API Key gerada',
      message: 'Nova chave copiada para a área de transferência'
    });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações básicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Nome completo"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                />
                <Select
                  label="Função"
                  value={profileData.role}
                  onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                  options={[
                    { value: 'Admin', label: 'Administrador' },
                    { value: 'ProjectManager', label: 'Gerente de Projeto' },
                    { value: 'Developer', label: 'Desenvolvedor' },
                    { value: 'Viewer', label: 'Visualizador' }
                  ]}
                  disabled
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    label="Senha atual"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    label="Nova senha"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                <Input
                  label="Confirmar nova senha"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
                
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword}>
                    <Shield className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessões Ativas</CardTitle>
                <CardDescription>
                  Gerencie onde você está logado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Sessão Atual</p>
                      <p className="text-sm text-gray-500">Chrome no macOS • São Paulo, Brasil</p>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Ativo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como você quer receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Notificações por email', description: 'Receber notificações por email' },
                    { key: 'flagChanges', label: 'Mudanças em flags', description: 'Quando uma feature flag for alterada' },
                    { key: 'projectUpdates', label: 'Atualizações de projeto', description: 'Quando houver mudanças nos projetos' },
                    { key: 'systemAlerts', label: 'Alertas do sistema', description: 'Notificações importantes do sistema' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{setting.label}</p>
                        <p className="text-sm text-gray-500">{setting.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [setting.key]: e.target.checked
                          }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Preferências
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Gerencie suas chaves de acesso à API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Gerar Nova Chave</p>
                    <p className="text-sm text-gray-500">Crie uma nova chave de API para integração</p>
                  </div>
                  <Button onClick={generateApiKey}>
                    <Key className="h-4 w-4 mr-2" />
                    Gerar Chave
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Chaves Existentes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">fh_abc123...xyz789</p>
                        <p className="text-xs text-gray-500">Criada em 15/10/2024</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'danger':
        return (
          <div className="space-y-6">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações irreversíveis que afetam sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Excluir Conta</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Esta ação é irreversível. Todos os seus dados, projetos e feature flags serão permanentemente removidos.
                  </p>
                  <Button variant="danger">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Minha Conta
                  </Button>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Limpar Dados</h4>
                  <p className="text-sm text-yellow-700 mb-4">
                    Remove todos os dados de analytics e logs, mantendo projetos e flags.
                  </p>
                  <Button variant="outline">
                    <Database className="h-4 w-4 mr-2" />
                    Limpar Dados de Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
