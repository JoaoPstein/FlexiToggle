import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  fps: number;
  loadTime: number;
}

interface PerformanceConfig {
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableMemoization: boolean;
  enablePreloading: boolean;
  enableCompression: boolean;
  enableCaching: boolean;
  maxConcurrentRequests: number;
  debounceDelay: number;
  throttleDelay: number;
}

interface PerformanceContextType {
  metrics: PerformanceMetrics;
  config: PerformanceConfig;
  updateConfig: (updates: Partial<PerformanceConfig>) => void;
  measurePerformance: (name: string, fn: () => void) => void;
  preloadRoute: (route: string) => void;
  optimizeImages: boolean;
  enableServiceWorker: () => void;
  clearCache: () => void;
}

const defaultConfig: PerformanceConfig = {
  enableVirtualization: true,
  enableLazyLoading: true,
  enableMemoization: true,
  enablePreloading: true,
  enableCompression: true,
  enableCaching: true,
  maxConcurrentRequests: 6,
  debounceDelay: 300,
  throttleDelay: 100,
};

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    fps: 60,
    loadTime: 0,
  });

  const [config, setConfig] = useState<PerformanceConfig>(() => {
    const saved = localStorage.getItem('featurehub-performance');
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  });

  // Monitorar métricas de performance
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          setMetrics(prev => ({
            ...prev,
            loadTime: navEntry.loadEventEnd - navEntry.navigationStart,
          }));
        }
        
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'measure', 'resource'] });

    return () => observer.disconnect();
  }, []);

  // Monitorar FPS
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({ ...prev, fps: frameCount }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    const animationId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Monitorar uso de memória
  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    const interval = setInterval(measureMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Salvar configuração
  useEffect(() => {
    localStorage.setItem('featurehub-performance', JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback((updates: Partial<PerformanceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const measurePerformance = useCallback((name: string, fn: () => void) => {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }, []);

  const preloadRoute = useCallback((route: string) => {
    if (!config.enablePreloading) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }, [config.enablePreloading]);

  const enableServiceWorker = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
        })
        .catch(error => {
          console.log('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  const clearCache = useCallback(() => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    localStorage.clear();
    sessionStorage.clear();
  }, []);

  // Otimização de imagens baseada na conexão
  const optimizeImages = useMemo(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType === '4g' || connection.effectiveType === '3g';
    }
    return true;
  }, []);

  return (
    <PerformanceContext.Provider value={{
      metrics,
      config,
      updateConfig,
      measurePerformance,
      preloadRoute,
      optimizeImages,
      enableServiceWorker,
      clearCache,
    }}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Hook para debounce
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttle
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const [lastCall, setLastCall] = useState(0);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      setLastCall(now);
      return callback(...args);
    }
  }, [callback, delay, lastCall]) as T;
};

// Hook para lazy loading
export const useLazyLoad = (ref: React.RefObject<HTMLElement>) => {
  const [isVisible, setIsVisible] = useState(false);
  const { config } = usePerformance();

  useEffect(() => {
    if (!config.enableLazyLoading || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, config.enableLazyLoading]);

  return isVisible;
};

// Hook para virtualização
export const useVirtualization = <T,>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const { config } = usePerformance();

  const visibleItems = useMemo(() => {
    if (!config.enableVirtualization) return items;

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, itemHeight, containerHeight, scrollTop, config.enableVirtualization]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
  };
};

// Hook para memoização inteligente
export const useSmartMemo = <T,>(
  factory: () => T,
  deps: React.DependencyList,
  shouldUpdate?: (prev: T, next: T) => boolean
): T => {
  const { config } = usePerformance();
  
  return useMemo(() => {
    if (!config.enableMemoization) return factory();
    
    const result = factory();
    
    if (shouldUpdate) {
      // Implementar lógica de comparação customizada
      return result;
    }
    
    return result;
  }, deps);
};

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
};
