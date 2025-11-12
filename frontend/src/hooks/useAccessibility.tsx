import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AccessibilityFeatures {
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusVisible: boolean;
  voiceCommands: boolean;
  colorBlindSupport: boolean;
}

interface AccessibilityContextType {
  features: AccessibilityFeatures;
  updateFeature: (feature: keyof AccessibilityFeatures, enabled: boolean) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  focusElement: (selector: string) => void;
  skipToContent: () => void;
  openAccessibilityPanel: () => void;
  keyboardShortcuts: Record<string, () => void>;
}

const defaultFeatures: AccessibilityFeatures = {
  screenReader: false,
  keyboardNavigation: true,
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  focusVisible: true,
  voiceCommands: false,
  colorBlindSupport: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<AccessibilityFeatures>(() => {
    const saved = localStorage.getItem('featurehub-accessibility');
    return saved ? { ...defaultFeatures, ...JSON.parse(saved) } : defaultFeatures;
  });

  const [isAccessibilityPanelOpen, setIsAccessibilityPanelOpen] = useState(false);

  // Detectar preferências do sistema
  useEffect(() => {
    // Detectar motion reduzido
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      updateFeature('reducedMotion', true);
    }

    // Detectar contraste alto
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    if (contrastQuery.matches) {
      updateFeature('highContrast', true);
    }

    // Detectar screen reader
    const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                           window.navigator.userAgent.includes('JAWS') || 
                           window.speechSynthesis;
    if (hasScreenReader) {
      updateFeature('screenReader', true);
    }
  }, []);

  // Salvar configurações
  useEffect(() => {
    localStorage.setItem('featurehub-accessibility', JSON.stringify(features));
  }, [features]);

  const updateFeature = useCallback((feature: keyof AccessibilityFeatures, enabled: boolean) => {
    setFeatures(prev => ({ ...prev, [feature]: enabled }));
  }, []);

  // Anunciar para screen readers
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Focar elemento
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      announceToScreenReader(`Focado em ${element.textContent || element.getAttribute('aria-label') || 'elemento'}`);
    }
  }, [announceToScreenReader]);

  // Pular para conteúdo principal
  const skipToContent = useCallback(() => {
    focusElement('#main-content');
  }, [focusElement]);

  // Abrir painel de acessibilidade
  const openAccessibilityPanel = useCallback(() => {
    setIsAccessibilityPanelOpen(true);
    announceToScreenReader('Painel de acessibilidade aberto');
  }, [announceToScreenReader]);

  // Atalhos de teclado
  const keyboardShortcuts = {
    'Alt+A': openAccessibilityPanel,
    'Alt+S': skipToContent,
    'Alt+H': () => focusElement('h1'),
    'Alt+M': () => focusElement('[role="main"]'),
    'Alt+N': () => focusElement('[role="navigation"]'),
    'Alt+1': () => focusElement('#dashboard-link'),
    'Alt+2': () => focusElement('#projects-link'),
    'Alt+3': () => focusElement('#flags-link'),
    'Alt+4': () => focusElement('#analytics-link'),
    'Alt+5': () => focusElement('#settings-link'),
  };

  // Configurar atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!features.keyboardNavigation) return;

      const combo = [
        event.altKey && 'Alt',
        event.ctrlKey && 'Ctrl',
        event.shiftKey && 'Shift',
        event.key
      ].filter(Boolean).join('+');

      const shortcut = keyboardShortcuts[combo];
      if (shortcut) {
        event.preventDefault();
        shortcut();
      }

      // Navegação por Tab melhorada
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }

      // ESC para fechar modais
      if (event.key === 'Escape') {
        const openModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
        if (openModal) {
          const closeButton = openModal.querySelector('[aria-label*="fechar"], [aria-label*="close"]') as HTMLElement;
          closeButton?.click();
        }
      }
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [features.keyboardNavigation, keyboardShortcuts]);

  // Aplicar classes CSS baseadas nas features
  useEffect(() => {
    const body = document.body;
    
    body.classList.toggle('high-contrast', features.highContrast);
    body.classList.toggle('large-text', features.largeText);
    body.classList.toggle('reduced-motion', features.reducedMotion);
    body.classList.toggle('focus-visible', features.focusVisible);
    body.classList.toggle('color-blind-support', features.colorBlindSupport);
    body.classList.toggle('screen-reader', features.screenReader);
  }, [features]);

  // Painel de acessibilidade
  const AccessibilityPanel = () => {
    if (!isAccessibilityPanelOpen) return null;

    return (
      <div
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsAccessibilityPanelOpen(false);
          }
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 id="accessibility-title" className="text-xl font-semibold">
              ♿ Configurações de Acessibilidade
            </h2>
            <button
              onClick={() => setIsAccessibilityPanelOpen(false)}
              aria-label="Fechar painel de acessibilidade"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(features).map(([key, enabled]) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateFeature(key as keyof AccessibilityFeatures, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  {getFeatureLabel(key as keyof AccessibilityFeatures)}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold mb-2">Atalhos de Teclado:</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <div><kbd>Alt+A</kbd> - Abrir acessibilidade</div>
              <div><kbd>Alt+S</kbd> - Pular para conteúdo</div>
              <div><kbd>Alt+H</kbd> - Focar título principal</div>
              <div><kbd>Alt+1-5</kbd> - Navegar menu</div>
              <div><kbd>Tab</kbd> - Navegar elementos</div>
              <div><kbd>Esc</kbd> - Fechar modais</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AccessibilityContext.Provider value={{
      features,
      updateFeature,
      announceToScreenReader,
      focusElement,
      skipToContent,
      openAccessibilityPanel,
      keyboardShortcuts,
    }}>
      {children}
      <AccessibilityPanel />
      
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
        onClick={(e) => {
          e.preventDefault();
          skipToContent();
        }}
      >
        Pular para o conteúdo principal
      </a>

      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" />
      <div aria-live="assertive" aria-atomic="true" className="sr-only" />
    </AccessibilityContext.Provider>
  );
};

function getFeatureLabel(feature: keyof AccessibilityFeatures): string {
  const labels = {
    screenReader: '🔊 Suporte a Leitor de Tela',
    keyboardNavigation: '⌨️ Navegação por Teclado',
    highContrast: '🔲 Alto Contraste',
    largeText: '🔍 Texto Grande',
    reducedMotion: '🎭 Movimento Reduzido',
    focusVisible: '🎯 Indicador de Foco',
    voiceCommands: '🎤 Comandos de Voz',
    colorBlindSupport: '🌈 Suporte Daltonismo',
  };
  return labels[feature];
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
