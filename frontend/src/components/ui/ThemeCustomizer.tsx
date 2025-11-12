import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Zap, 
  Eye, 
  Type, 
  Layout, 
  Download, 
  Upload, 
  RotateCcw,
  Settings,
  Sparkles,
  Accessibility
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAccessibility } from '../../hooks/useAccessibility';
import { AnimatedButton } from './AnimatedButton';
import { Card, CardContent } from './Card';
import { cn } from '../../utils/cn';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ isOpen, onClose }) => {
  const { config, colors, updateTheme, toggleMode, setVariant, resetTheme, exportTheme, importTheme } = useTheme();
  const { features, updateFeature, openAccessibilityPanel } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'theme' | 'accessibility' | 'performance'>('theme');

  const themeVariants = [
    { id: 'default', name: 'Padrão', colors: ['#3b82f6', '#6366f1', '#8b5cf6'] },
    { id: 'ocean', name: 'Oceano', colors: ['#0ea5e9', '#0284c7', '#06b6d4'] },
    { id: 'forest', name: 'Floresta', colors: ['#059669', '#047857', '#10b981'] },
    { id: 'sunset', name: 'Pôr do Sol', colors: ['#f97316', '#ea580c', '#fb923c'] },
    { id: 'neon', name: 'Neon', colors: ['#a855f7', '#9333ea', '#c084fc'] },
    { id: 'minimal', name: 'Minimalista', colors: ['#374151', '#4b5563', '#6b7280'] },
    { id: 'high-contrast', name: 'Alto Contraste', colors: ['#000000', '#ffffff', '#808080'] },
  ];

  const animations = [
    { id: 'smooth', name: 'Suave', icon: '🌊' },
    { id: 'bouncy', name: 'Saltitante', icon: '🏀' },
    { id: 'elegant', name: 'Elegante', icon: '✨' },
    { id: 'instant', name: 'Instantâneo', icon: '⚡' },
  ];

  const handleImportTheme = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          importTheme(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleExportTheme = () => {
    const themeData = exportTheme();
    const blob = new Blob([themeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'featurehub-theme.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Personalizador de Interface</h2>
                  <p className="text-blue-100">Customize sua experiência visual</p>
                </div>
              </div>
              <AnimatedButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                animation="bounce"
              >
                ✕
              </AnimatedButton>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-6 bg-white/10 rounded-lg p-1">
              {[
                { id: 'theme', label: 'Temas', icon: Palette },
                { id: 'accessibility', label: 'Acessibilidade', icon: Accessibility },
                { id: 'performance', label: 'Performance', icon: Zap },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'theme' && (
              <div className="space-y-6">
                {/* Modo de Tema */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Sun className="h-5 w-5 mr-2 text-yellow-500" />
                      Modo de Tema
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { mode: 'light', icon: Sun, label: 'Claro' },
                        { mode: 'dark', icon: Moon, label: 'Escuro' },
                        { mode: 'auto', icon: Monitor, label: 'Automático' },
                      ].map(({ mode, icon: Icon, label }) => (
                        <AnimatedButton
                          key={mode}
                          variant={config.mode === mode ? 'primary' : 'outline'}
                          onClick={() => updateTheme({ mode: mode as any })}
                          className="h-16 flex-col space-y-1"
                          animation="bounce"
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm">{label}</span>
                        </AnimatedButton>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Variantes de Tema */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                      Variantes de Cor
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {themeVariants.map((variant) => (
                        <motion.button
                          key={variant.id}
                          onClick={() => setVariant(variant.id as any)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            config.variant === variant.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex space-x-1 mb-2">
                            {variant.colors.map((color, index) => (
                              <div
                                key={index}
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className="text-sm font-medium">{variant.name}</p>
                        </motion.button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Configurações de Layout */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Layout className="h-5 w-5 mr-2 text-green-500" />
                      Configurações de Layout
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tamanho da Fonte */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Tamanho da Fonte</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['small', 'medium', 'large', 'xl'].map((size) => (
                            <AnimatedButton
                              key={size}
                              variant={config.fontSize === size ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => updateTheme({ fontSize: size as any })}
                              animation="pulse"
                            >
                              <Type className={`h-${size === 'small' ? '3' : size === 'medium' ? '4' : size === 'large' ? '5' : '6'} w-${size === 'small' ? '3' : size === 'medium' ? '4' : size === 'large' ? '5' : '6'}`} />
                            </AnimatedButton>
                          ))}
                        </div>
                      </div>

                      {/* Espaçamento */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Espaçamento</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['compact', 'comfortable', 'spacious'].map((spacing) => (
                            <AnimatedButton
                              key={spacing}
                              variant={config.spacing === spacing ? 'primary' : 'outline'}
                              size="sm"
                              onClick={() => updateTheme({ spacing: spacing as any })}
                              animation="glow"
                            >
                              {spacing === 'compact' ? '📦' : spacing === 'comfortable' ? '🏠' : '🌌'}
                            </AnimatedButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Animações */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                      Estilo de Animação
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {animations.map((anim) => (
                        <AnimatedButton
                          key={anim.id}
                          variant={config.animation === anim.id ? 'primary' : 'outline'}
                          onClick={() => updateTheme({ animation: anim.id as any })}
                          className="h-16 flex-col space-y-1"
                          animation={anim.id as any}
                        >
                          <span className="text-xl">{anim.icon}</span>
                          <span className="text-sm">{anim.name}</span>
                        </AnimatedButton>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'accessibility' && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Accessibility className="h-5 w-5 mr-2 text-blue-500" />
                      Configurações de Acessibilidade
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(features).map(([key, enabled]) => (
                        <label key={key} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => updateFeature(key as any, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div>
                            <p className="font-medium">{getFeatureLabel(key)}</p>
                            <p className="text-sm text-gray-500">{getFeatureDescription(key)}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-6">
                      <AnimatedButton
                        onClick={openAccessibilityPanel}
                        variant="primary"
                        animation="bounce"
                        icon={<Settings className="h-4 w-4" />}
                      >
                        Abrir Painel Completo de Acessibilidade
                      </AnimatedButton>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                      Otimizações de Performance
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">Movimento Reduzido</p>
                          <p className="text-sm text-gray-500">Reduz animações para melhor performance</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.reducedMotion}
                            onChange={(e) => updateTheme({ reducedMotion: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">Alto Contraste</p>
                          <p className="text-sm text-gray-500">Melhora visibilidade e legibilidade</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.highContrast}
                            onChange={(e) => updateTheme({ highContrast: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <AnimatedButton
                  variant="outline"
                  onClick={handleExportTheme}
                  icon={<Download className="h-4 w-4" />}
                  animation="bounce"
                >
                  Exportar Tema
                </AnimatedButton>
                
                <AnimatedButton
                  variant="outline"
                  onClick={handleImportTheme}
                  icon={<Upload className="h-4 w-4" />}
                  animation="bounce"
                >
                  Importar Tema
                </AnimatedButton>
                
                <AnimatedButton
                  variant="outline"
                  onClick={resetTheme}
                  icon={<RotateCcw className="h-4 w-4" />}
                  animation="shake"
                >
                  Resetar
                </AnimatedButton>
              </div>

              <AnimatedButton
                variant="primary"
                onClick={onClose}
                animation="glow"
              >
                Aplicar Configurações
              </AnimatedButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

function getFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    screenReader: 'Leitor de Tela',
    keyboardNavigation: 'Navegação por Teclado',
    highContrast: 'Alto Contraste',
    largeText: 'Texto Grande',
    reducedMotion: 'Movimento Reduzido',
    focusVisible: 'Indicador de Foco',
    voiceCommands: 'Comandos de Voz',
    colorBlindSupport: 'Suporte Daltonismo',
  };
  return labels[key] || key;
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    screenReader: 'Otimiza para leitores de tela',
    keyboardNavigation: 'Permite navegar apenas com teclado',
    highContrast: 'Aumenta contraste para melhor visibilidade',
    largeText: 'Aumenta tamanho do texto',
    reducedMotion: 'Reduz animações e movimentos',
    focusVisible: 'Mostra indicador quando elemento está focado',
    voiceCommands: 'Permite controle por voz',
    colorBlindSupport: 'Ajusta cores para daltonismo',
  };
  return descriptions[key] || '';
}
