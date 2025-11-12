import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ThemeVariant = 'default' | 'ocean' | 'forest' | 'sunset' | 'neon' | 'minimal' | 'high-contrast';
export type ThemeAnimation = 'smooth' | 'bouncy' | 'instant' | 'elegant';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ThemeConfig {
  mode: ThemeMode;
  variant: ThemeVariant;
  animation: ThemeAnimation;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  spacing: 'compact' | 'comfortable' | 'spacious';
  reducedMotion: boolean;
  highContrast: boolean;
  colorBlindFriendly: boolean;
}

interface ThemeContextType {
  config: ThemeConfig;
  colors: ThemeColors;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
  setVariant: (variant: ThemeVariant) => void;
  resetTheme: () => void;
  exportTheme: () => string;
  importTheme: (themeString: string) => void;
}

const defaultConfig: ThemeConfig = {
  mode: 'auto',
  variant: 'default',
  animation: 'smooth',
  fontSize: 'medium',
  borderRadius: 'medium',
  spacing: 'comfortable',
  reducedMotion: false,
  highContrast: false,
  colorBlindFriendly: false,
};

const themeVariants: Record<ThemeVariant, { light: ThemeColors; dark: ThemeColors }> = {
  default: {
    light: {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
    },
    dark: {
      primary: '#60a5fa',
      secondary: '#818cf8',
      accent: '#a78bfa',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#22d3ee',
    },
  },
  ocean: {
    light: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#06b6d4',
      background: '#f0f9ff',
      surface: '#e0f2fe',
      text: '#0c4a6e',
      textSecondary: '#0369a1',
      border: '#bae6fd',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0891b2',
    },
    dark: {
      primary: '#38bdf8',
      secondary: '#0ea5e9',
      accent: '#22d3ee',
      background: '#0c1821',
      surface: '#164e63',
      text: '#f0f9ff',
      textSecondary: '#67e8f9',
      border: '#155e75',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
    },
  },
  forest: {
    light: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981',
      background: '#f0fdf4',
      surface: '#dcfce7',
      text: '#14532d',
      textSecondary: '#166534',
      border: '#bbf7d0',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#06b6d4',
    },
    dark: {
      primary: '#34d399',
      secondary: '#10b981',
      accent: '#6ee7b7',
      background: '#0a1f0f',
      surface: '#14532d',
      text: '#f0fdf4',
      textSecondary: '#86efac',
      border: '#166534',
      success: '#22c55e',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#22d3ee',
    },
  },
  sunset: {
    light: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fb923c',
      background: '#fffbeb',
      surface: '#fef3c7',
      text: '#9a3412',
      textSecondary: '#c2410c',
      border: '#fed7aa',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#0284c7',
    },
    dark: {
      primary: '#fb923c',
      secondary: '#f97316',
      accent: '#fdba74',
      background: '#1c1917',
      surface: '#451a03',
      text: '#fffbeb',
      textSecondary: '#fed7aa',
      border: '#9a3412',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
    },
  },
  neon: {
    light: {
      primary: '#a855f7',
      secondary: '#9333ea',
      accent: '#c084fc',
      background: '#fefbff',
      surface: '#f3e8ff',
      text: '#581c87',
      textSecondary: '#7c3aed',
      border: '#d8b4fe',
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff0055',
      info: '#00aaff',
    },
    dark: {
      primary: '#c084fc',
      secondary: '#a855f7',
      accent: '#e879f9',
      background: '#0a0a0f',
      surface: '#1a0a2e',
      text: '#fefbff',
      textSecondary: '#d8b4fe',
      border: '#581c87',
      success: '#00ff88',
      warning: '#ffaa00',
      error: '#ff0055',
      info: '#00aaff',
    },
  },
  minimal: {
    light: {
      primary: '#374151',
      secondary: '#4b5563',
      accent: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#d1d5db',
      success: '#374151',
      warning: '#374151',
      error: '#374151',
      info: '#374151',
    },
    dark: {
      primary: '#d1d5db',
      secondary: '#9ca3af',
      accent: '#6b7280',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      border: '#374151',
      success: '#d1d5db',
      warning: '#d1d5db',
      error: '#d1d5db',
      info: '#d1d5db',
    },
  },
  'high-contrast': {
    light: {
      primary: '#000000',
      secondary: '#000000',
      accent: '#000000',
      background: '#ffffff',
      surface: '#ffffff',
      text: '#000000',
      textSecondary: '#000000',
      border: '#000000',
      success: '#000000',
      warning: '#000000',
      error: '#000000',
      info: '#000000',
    },
    dark: {
      primary: '#ffffff',
      secondary: '#ffffff',
      accent: '#ffffff',
      background: '#000000',
      surface: '#000000',
      text: '#ffffff',
      textSecondary: '#ffffff',
      border: '#ffffff',
      success: '#ffffff',
      warning: '#ffffff',
      error: '#ffffff',
      info: '#ffffff',
    },
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('featurehub-theme');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const [systemDarkMode, setSystemDarkMode] = useState(false);

  // Detectar preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDarkMode(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Detectar preferência de movimento reduzido
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setConfig(prev => ({ ...prev, reducedMotion: true }));
    }
  }, []);

  // Salvar configuração
  useEffect(() => {
    localStorage.setItem('featurehub-theme', JSON.stringify(config));
  }, [config]);

  // Determinar modo atual
  const currentMode = config.mode === 'auto' 
    ? (systemDarkMode ? 'dark' : 'light')
    : config.mode === 'dark' ? 'dark' : 'light';

  // Obter cores atuais
  const colors = themeVariants[config.variant][currentMode];

  // Aplicar CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Cores
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Configurações
    root.style.setProperty('--font-size-base', {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px',
    }[config.fontSize]);

    root.style.setProperty('--border-radius', {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '12px',
      full: '9999px',
    }[config.borderRadius]);

    root.style.setProperty('--spacing-unit', {
      compact: '0.75rem',
      comfortable: '1rem',
      spacious: '1.5rem',
    }[config.spacing]);

    root.style.setProperty('--animation-duration', {
      instant: '0ms',
      smooth: '200ms',
      bouncy: '300ms',
      elegant: '500ms',
    }[config.animation]);

    // Classes do body
    document.body.className = [
      `theme-${config.variant}`,
      `mode-${currentMode}`,
      `animation-${config.animation}`,
      `spacing-${config.spacing}`,
      config.reducedMotion ? 'reduced-motion' : '',
      config.highContrast ? 'high-contrast' : '',
      config.colorBlindFriendly ? 'color-blind-friendly' : '',
    ].filter(Boolean).join(' ');

  }, [colors, config, currentMode]);

  const updateTheme = (updates: Partial<ThemeConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const toggleMode = () => {
    setConfig(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : prev.mode === 'dark' ? 'auto' : 'light'
    }));
  };

  const setVariant = (variant: ThemeVariant) => {
    setConfig(prev => ({ ...prev, variant }));
  };

  const resetTheme = () => {
    setConfig(defaultConfig);
  };

  const exportTheme = () => {
    return JSON.stringify(config, null, 2);
  };

  const importTheme = (themeString: string) => {
    try {
      const imported = JSON.parse(themeString);
      setConfig({ ...defaultConfig, ...imported });
    } catch (error) {
      console.error('Invalid theme format:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{
      config,
      colors,
      updateTheme,
      toggleMode,
      setVariant,
      resetTheme,
      exportTheme,
      importTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
