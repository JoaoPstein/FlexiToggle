import React, { useState } from 'react';
import { X, Flag, Save, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { useToast } from '../ui/Toast';
import { apiService } from '../../services/api';
import type { CreateFeatureFlagRequest, Project } from '../../types';

interface CreateFeatureFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
  selectedProjectId?: number;
}

export const CreateFeatureFlagModal: React.FC<CreateFeatureFlagModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projects,
  selectedProjectId
}) => {
  const [formData, setFormData] = useState<CreateFeatureFlagRequest>({
    name: '',
    description: '',
    key: '',
    type: 'Boolean',
    projectId: selectedProjectId || (projects[0]?.Id || 0)
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addToast } = useToast();

  const handleInputChange = (field: keyof CreateFeatureFlagRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate key from name
    if (field === 'name' && typeof value === 'string') {
      const key = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-_]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, key }));
    }
    
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

    if (!formData.key.trim()) {
      newErrors.key = 'Chave é obrigatória';
    } else if (!/^[a-z0-9-_]+$/.test(formData.key)) {
      newErrors.key = 'Chave deve conter apenas letras minúsculas, números, hífens e underscores';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Projeto é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await apiService.createFeatureFlag(formData);
      
      addToast({
        type: 'success',
        title: 'Feature Flag criada!',
        message: `A flag "${formData.name}" foi criada com sucesso`
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating feature flag:', error);
      addToast({
        type: 'error',
        title: 'Erro ao criar flag',
        message: error.response?.data?.message || 'Não foi possível criar a feature flag'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      key: '',
      type: 'Boolean',
      projectId: selectedProjectId || (projects[0]?.Id || 0)
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Flag className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Nova Feature Flag</h2>
            <p className="text-sm text-gray-500">Crie uma nova funcionalidade para controlar</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
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
              label="Chave"
              placeholder="Ex: new-checkout-feature"
              value={formData.key}
              onChange={(e) => handleInputChange('key', e.target.value)}
              error={errors.key}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Apenas letras minúsculas, números, hífens e underscores
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Valor
            </label>
            <Select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as any)}
              options={[
                { value: 'Boolean', label: 'Boolean (true/false)' },
                { value: 'String', label: 'String (texto)' },
                { value: 'Number', label: 'Number (número)' },
                { value: 'Json', label: 'JSON (objeto)' }
              ]}
              disabled={isLoading}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Projeto
            </label>
            <Select
              value={formData.projectId.toString()}
              onChange={(e) => handleInputChange('projectId', parseInt(e.target.value))}
              options={projects.map(p => ({ value: p.Id.toString(), label: p.Name }))}
              error={errors.projectId}
              disabled={isLoading}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Descrição"
              placeholder="Descreva o que esta flag controla..."
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
            />
          </div>
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
                Criando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Flag
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
