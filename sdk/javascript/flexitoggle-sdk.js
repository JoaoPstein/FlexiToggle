/**
 * FlexiToggle JavaScript SDK
 * 
 * Uma biblioteca leve e poderosa para integração com FlexiToggle
 * Suporta feature flags, A/B testing e analytics em tempo real
 * 
 * @version 1.0.0
 * @author FlexiToggle Team
 */

class FlexiToggleSDK {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'http://localhost:5000';
    this.projectKey = config.projectKey;
    this.environment = config.environment || 'production';
    this.userId = config.userId;
    this.sessionId = config.sessionId || this.generateSessionId();
    this.userAttributes = config.userAttributes || {};
    this.enableAnalytics = config.enableAnalytics !== false;
    this.pollingInterval = config.pollingInterval || 30000; // 30 seconds
    
    // Internal state
    this.flags = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
    this.pollingTimer = null;
    this.cache = new Map();
    
    // Event emitter
    this.events = new EventTarget();
    
    // Initialize SDK
    this.initialize();
  }

  /**
   * Initialize the SDK
   */
  async initialize() {
    try {
      await this.fetchFlags();
      this.isInitialized = true;
      this.startPolling();
      this.emit('ready');
      console.log('FlexiToggle SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FlexiToggle SDK:', error);
      this.emit('error', error);
    }
  }

  /**
   * Fetch all feature flags from the server
   */
  async fetchFlags() {
    try {
      const response = await fetch(`${this.apiUrl}/api/evaluation/flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectKey: this.projectKey,
          environment: this.environment,
          userId: this.userId,
          sessionId: this.sessionId,
          userAttributes: this.userAttributes
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Update flags cache
      this.flags.clear();
      Object.entries(data.flags || {}).forEach(([key, value]) => {
        this.flags.set(key, value);
      });

      this.emit('flagsUpdated', this.flags);
      return data;
    } catch (error) {
      console.error('Error fetching flags:', error);
      throw error;
    }
  }

  /**
   * Get a feature flag value
   * @param {string} flagKey - The flag key
   * @param {any} defaultValue - Default value if flag not found
   * @returns {any} Flag value
   */
  getFlag(flagKey, defaultValue = false) {
    if (!this.isInitialized) {
      console.warn('SDK not initialized yet, returning default value');
      return defaultValue;
    }

    const flag = this.flags.get(flagKey);
    if (flag === undefined) {
      console.warn(`Flag "${flagKey}" not found, returning default value`);
      return defaultValue;
    }

    // Record analytics if enabled
    if (this.enableAnalytics) {
      this.recordEvaluation(flagKey, flag);
    }

    return flag;
  }

  /**
   * Check if a feature flag is enabled
   * @param {string} flagKey - The flag key
   * @returns {boolean} True if flag is enabled
   */
  isEnabled(flagKey) {
    return Boolean(this.getFlag(flagKey, false));
  }

  /**
   * Get a string flag value
   * @param {string} flagKey - The flag key
   * @param {string} defaultValue - Default value
   * @returns {string} Flag value
   */
  getString(flagKey, defaultValue = '') {
    return String(this.getFlag(flagKey, defaultValue));
  }

  /**
   * Get a number flag value
   * @param {string} flagKey - The flag key
   * @param {number} defaultValue - Default value
   * @returns {number} Flag value
   */
  getNumber(flagKey, defaultValue = 0) {
    const value = this.getFlag(flagKey, defaultValue);
    return Number(value) || defaultValue;
  }

  /**
   * Get a JSON flag value
   * @param {string} flagKey - The flag key
   * @param {object} defaultValue - Default value
   * @returns {object} Flag value
   */
  getJSON(flagKey, defaultValue = {}) {
    const value = this.getFlag(flagKey, defaultValue);
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn(`Failed to parse JSON for flag "${flagKey}":`, error);
        return defaultValue;
      }
    }
    return value || defaultValue;
  }

  /**
   * Get A/B test variant
   * @param {string} testKey - The test key
   * @param {string} defaultVariant - Default variant
   * @returns {string} Variant name
   */
  getVariant(testKey, defaultVariant = 'control') {
    const test = this.getJSON(testKey, null);
    if (!test || !test.variants) {
      return defaultVariant;
    }

    // Use consistent hashing based on user ID
    const hash = this.hashUserId(this.userId + testKey);
    const totalWeight = test.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    
    if (totalWeight === 0) return defaultVariant;

    const target = (hash % 100) + 1;
    let currentWeight = 0;

    for (const variant of test.variants) {
      currentWeight += variant.weight || 0;
      if (target <= (currentWeight / totalWeight) * 100) {
        // Record A/B test exposure
        if (this.enableAnalytics) {
          this.recordABTestExposure(testKey, variant.name);
        }
        return variant.name;
      }
    }

    return defaultVariant;
  }

  /**
   * Track a custom event
   * @param {string} eventName - Event name
   * @param {object} properties - Event properties
   */
  track(eventName, properties = {}) {
    if (!this.enableAnalytics) return;

    const event = {
      name: eventName,
      properties: {
        ...properties,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.sendAnalytics('event', event);
  }

  /**
   * Track a conversion for A/B testing
   * @param {string} testKey - Test key
   * @param {string} metricName - Metric name
   * @param {number} value - Metric value
   */
  trackConversion(testKey, metricName, value = 1) {
    if (!this.enableAnalytics) return;

    const conversion = {
      testKey,
      metricName,
      value,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.sendAnalytics('conversion', conversion);
  }

  /**
   * Update user attributes
   * @param {object} attributes - New attributes
   */
  updateUserAttributes(attributes) {
    this.userAttributes = { ...this.userAttributes, ...attributes };
    this.fetchFlags(); // Refresh flags with new attributes
  }

  /**
   * Set user ID
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
    this.fetchFlags(); // Refresh flags for new user
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    this.events.addEventListener(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    this.events.removeEventListener(event, callback);
  }

  /**
   * Add flag change listener
   * @param {string} flagKey - Flag key to watch
   * @param {function} callback - Callback function
   */
  onFlagChange(flagKey, callback) {
    if (!this.listeners.has(flagKey)) {
      this.listeners.set(flagKey, new Set());
    }
    this.listeners.get(flagKey).add(callback);
  }

  /**
   * Remove flag change listener
   * @param {string} flagKey - Flag key
   * @param {function} callback - Callback function
   */
  offFlagChange(flagKey, callback) {
    const listeners = this.listeners.get(flagKey);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Refresh flags manually
   */
  async refresh() {
    try {
      await this.fetchFlags();
    } catch (error) {
      console.error('Error refreshing flags:', error);
    }
  }

  /**
   * Close SDK and cleanup
   */
  close() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isInitialized = false;
    this.emit('closed');
  }

  // Private methods

  generateSessionId() {
    return 'sess_' + Math.random().toString(36).substr(2, 16);
  }

  hashUserId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  startPolling() {
    if (this.pollingInterval > 0) {
      this.pollingTimer = setInterval(() => {
        this.fetchFlags().catch(console.error);
      }, this.pollingInterval);
    }
  }

  emit(event, data) {
    this.events.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  recordEvaluation(flagKey, value) {
    const evaluation = {
      flagKey,
      value,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAttributes: this.userAttributes
    };

    this.sendAnalytics('evaluation', evaluation);
  }

  recordABTestExposure(testKey, variant) {
    const exposure = {
      testKey,
      variant,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.sendAnalytics('exposure', exposure);
  }

  sendAnalytics(type, data) {
    // Batch analytics to avoid too many requests
    if (!this.analyticsBatch) {
      this.analyticsBatch = [];
      setTimeout(() => {
        this.flushAnalytics();
      }, 1000);
    }

    this.analyticsBatch.push({ type, data });
  }

  async flushAnalytics() {
    if (!this.analyticsBatch || this.analyticsBatch.length === 0) return;

    try {
      await fetch(`${this.apiUrl}/api/analytics/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectKey: this.projectKey,
          environment: this.environment,
          events: this.analyticsBatch
        })
      });
    } catch (error) {
      console.error('Error sending analytics:', error);
    } finally {
      this.analyticsBatch = [];
    }
  }

  notifyFlagChange(flagKey, oldValue, newValue) {
    const listeners = this.listeners.get(flagKey);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error('Error in flag change listener:', error);
        }
      });
    }
  }
}

// React Hook for FlexiToggle
if (typeof window !== 'undefined' && window.React) {
  const { useState, useEffect, useContext, createContext } = window.React;

  // Context for FlexiToggle
  const FlexiToggleContext = createContext(null);

  // Provider component
  window.FlexiToggleProvider = ({ children, config }) => {
    const [sdk, setSdk] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      const featureHub = new FlexiToggleSDK(config);
      
      featureHub.on('ready', () => {
        setIsReady(true);
      });

      setSdk(featureHub);

      return () => {
        featureHub.close();
      };
    }, []);

    return React.createElement(
      FlexiToggleContext.Provider,
      { value: { sdk, isReady } },
      children
    );
  };

  // Hook to use FlexiToggle
  window.useFlexiToggle = () => {
    const context = useContext(FlexiToggleContext);
    if (!context) {
      throw new Error('useFlexiToggle must be used within a FlexiToggleProvider');
    }
    return context;
  };

  // Hook for individual flags
  window.useFeatureFlag = (flagKey, defaultValue = false) => {
    const { sdk, isReady } = window.useFlexiToggle();
    const [value, setValue] = useState(defaultValue);

    useEffect(() => {
      if (!sdk || !isReady) return;

      const updateValue = () => {
        setValue(sdk.getFlag(flagKey, defaultValue));
      };

      updateValue();
      sdk.onFlagChange(flagKey, updateValue);

      return () => {
        sdk.offFlagChange(flagKey, updateValue);
      };
    }, [sdk, isReady, flagKey, defaultValue]);

    return value;
  };
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlexiToggleSDK;
} else if (typeof define === 'function' && define.amd) {
  define([], () => FlexiToggleSDK);
} else if (typeof window !== 'undefined') {
  window.FlexiToggleSDK = FlexiToggleSDK;
}

// TypeScript definitions (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports.FlexiToggleSDK = FlexiToggleSDK;
}
