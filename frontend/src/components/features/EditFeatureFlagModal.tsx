import React, { useState, useEffect } from 'react';
import { X, Flag, Save, Loader2, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { apiService } from '../../services/api';
import type { FeatureFlag } from '../../types';

interface EditFeatureFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flag: FeatureFlag | null;
  projectId: number;
}

interface UpdateFeatureFlagRequest {
  name: string;
  description?: string;
  tagIds?: number[];
}

export const EditFeatureFlagModal: React.FC<EditFeatureFlagModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  flag,
  projectId
}) => {
  const [formData, setFormData] = useState<UpdateFeatureFlagRequest>({
    name: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  useEffect(() => {
    if (flag) {
      setFormData({
        name: flag.name,
        description: flag.description || ''
      });
    }
  }, [flag]);

  const handleInputChange = (field: keyof UpdateFeatureFlagRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flag || !validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await apiService.updateFeatureFlag(projectId, flag.id, formData);
      
      addToast({
        type: 'success',
        title: 'Feature Flag atualizada!',
        message: `A flag "${formData.name}" foi atualizada com sucesso`
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error updating feature flag:', error);
      addToast({
        type: 'error',
        title: 'Erro ao atualizar flag',
        message: error.response?.data?.message || 'Não foi possível atualizar a feature flag'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: ''
    });
    setErrors({});
    onClose();
  };

  if (!flag) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Editar Feature Flag</h2>
            <p className="text-sm text-gray-500">Atualize as informações da flag</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-6">
          <div>
            <Input
              label="Nome da Flag"
              placeholder="Ex: Nova funcionalidade de checkout"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="Descrição"
              placeholder="Descreva o que esta flag controla..."
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Informações somente leitura */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Informações da Flag</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Chave:</span>
                <span className="ml-2 font-mono text-gray-900">{flag.Key}</span>
              </div>
              <div>
                <span className="text-gray-500">Tipo:</span>
                <span className="ml-2 text-gray-900">{flag.Type}</span>
              </div>
              <div>
                <span className="text-gray-500">Criado por:</span>
                <span className="ml-2 text-gray-900">{flag.CreatedBy.Name}</span>
              </div>
              <div>
                <span className="text-gray-500">Criado em:</span>
                <span className="ml-2 text-gray-900">
                  {new Date(flag.CreatedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Status dos ambientes */}
          {flag.environments.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Status nos Ambientes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {flag.environments.map((env) => (
                  <div key={env.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm font-medium text-gray-900">
                      {env.environment.name}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      env.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {env.isEnabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
