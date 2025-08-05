/**
 * Debug Logger Utility
 * Provides comprehensive logging for production debugging
 */

const DEBUG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

class DebugLogger {
  constructor() {
    // Check if debug mode is enabled via URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    this.debugEnabled = urlParams.get('debug') === 'true' || 
                       localStorage.getItem('debug_mode') === 'true';
    
    // Set debug level (default to INFO in production, DEBUG in dev)
    const level = urlParams.get('debug_level') || 
                  localStorage.getItem('debug_level') || 
                  (import.meta.env.DEV ? 'DEBUG' : 'INFO');
    
    this.debugLevel = DEBUG_LEVELS[level.toUpperCase()] || DEBUG_LEVELS.INFO;
    
    // Log initialization
    if (this.debugEnabled) {
      console.log('%c🔍 Debug Logger Initialized', 'color: #9e1f63; font-weight: bold', {
        enabled: this.debugEnabled,
        level: level,
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString()
      });
    }
  }

  _shouldLog(level) {
    return this.debugEnabled && level <= this.debugLevel;
  }

  _formatMessage(level, category, message, data) {
    const timestamp = new Date().toISOString();
    const levelName = Object.keys(DEBUG_LEVELS).find(key => DEBUG_LEVELS[key] === level);
    const env = import.meta.env.MODE;
    
    return {
      timestamp,
      level: levelName,
      category,
      message,
      data,
      env,
      url: window.location.href
    };
  }

  _getStyle(level) {
    switch (level) {
      case DEBUG_LEVELS.ERROR:
        return 'color: #e74c3c; font-weight: bold';
      case DEBUG_LEVELS.WARN:
        return 'color: #f39c12; font-weight: bold';
      case DEBUG_LEVELS.INFO:
        return 'color: #3498db';
      case DEBUG_LEVELS.DEBUG:
        return 'color: #2ecc71';
      case DEBUG_LEVELS.TRACE:
        return 'color: #95a5a6; font-style: italic';
      default:
        return '';
    }
  }

  error(category, message, data = {}) {
    if (this._shouldLog(DEBUG_LEVELS.ERROR)) {
      const formatted = this._formatMessage(DEBUG_LEVELS.ERROR, category, message, data);
      console.error(`%c[ERROR] [${category}] ${message}`, this._getStyle(DEBUG_LEVELS.ERROR), formatted);
    }
  }

  warn(category, message, data = {}) {
    if (this._shouldLog(DEBUG_LEVELS.WARN)) {
      const formatted = this._formatMessage(DEBUG_LEVELS.WARN, category, message, data);
      console.warn(`%c[WARN] [${category}] ${message}`, this._getStyle(DEBUG_LEVELS.WARN), formatted);
    }
  }

  info(category, message, data = {}) {
    if (this._shouldLog(DEBUG_LEVELS.INFO)) {
      const formatted = this._formatMessage(DEBUG_LEVELS.INFO, category, message, data);
      console.log(`%c[INFO] [${category}] ${message}`, this._getStyle(DEBUG_LEVELS.INFO), formatted);
    }
  }

  debug(category, message, data = {}) {
    if (this._shouldLog(DEBUG_LEVELS.DEBUG)) {
      const formatted = this._formatMessage(DEBUG_LEVELS.DEBUG, category, message, data);
      console.log(`%c[DEBUG] [${category}] ${message}`, this._getStyle(DEBUG_LEVELS.DEBUG), formatted);
    }
  }

  trace(category, message, data = {}) {
    if (this._shouldLog(DEBUG_LEVELS.TRACE)) {
      const formatted = this._formatMessage(DEBUG_LEVELS.TRACE, category, message, data);
      console.log(`%c[TRACE] [${category}] ${message}`, this._getStyle(DEBUG_LEVELS.TRACE), formatted);
    }
  }

  // Special methods for specific debugging needs
  asset(assetPath, status, details = {}) {
    this.info('ASSET', `Asset ${status}: ${assetPath}`, {
      ...details,
      assetPath,
      status,
      baseURL: document.baseURI
    });
  }

  transition(component, phase, details = {}) {
    this.debug('TRANSITION', `${component} - ${phase}`, {
      ...details,
      component,
      phase,
      timestamp: performance.now()
    });
  }

  api(method, endpoint, status, details = {}) {
    const level = status === 'error' ? DEBUG_LEVELS.ERROR : DEBUG_LEVELS.INFO;
    if (this._shouldLog(level)) {
      const formatted = this._formatMessage(level, 'API', `${method} ${endpoint} - ${status}`, {
        ...details,
        method,
        endpoint,
        status
      });
      console.log(`%c[API] ${method} ${endpoint} - ${status}`, this._getStyle(level), formatted);
    }
  }

  performance(operation, duration, details = {}) {
    this.debug('PERFORMANCE', `${operation} took ${duration}ms`, {
      ...details,
      operation,
      duration,
      timestamp: performance.now()
    });
  }

  state(component, stateType, oldValue, newValue) {
    this.debug('STATE', `${component} ${stateType} changed`, {
      component,
      stateType,
      oldValue,
      newValue,
      timestamp: performance.now()
    });
  }

  // Enable/disable debug mode
  enable(level = 'DEBUG') {
    this.debugEnabled = true;
    this.debugLevel = DEBUG_LEVELS[level.toUpperCase()] || DEBUG_LEVELS.DEBUG;
    localStorage.setItem('debug_mode', 'true');
    localStorage.setItem('debug_level', level);
    console.log('%c🔍 Debug mode enabled', 'color: #9e1f63; font-weight: bold');
  }

  disable() {
    this.debugEnabled = false;
    localStorage.removeItem('debug_mode');
    localStorage.removeItem('debug_level');
    console.log('%c🔍 Debug mode disabled', 'color: #9e1f63; font-weight: bold');
  }
}

// Create singleton instance
const logger = new DebugLogger();

// Expose to window for production debugging
if (typeof window !== 'undefined') {
  window.__debugLogger = logger;
  window.__enableDebug = (level) => logger.enable(level);
  window.__disableDebug = () => logger.disable();
  
  // Add help function
  window.__debugHelp = () => {
    console.log('%c🔍 Debug Logger Help', 'color: #9e1f63; font-weight: bold; font-size: 16px');
    console.log('%cAvailable commands:', 'font-weight: bold');
    console.log('  __enableDebug("DEBUG")  - Enable debug logging (levels: ERROR, WARN, INFO, DEBUG, TRACE)');
    console.log('  __disableDebug()        - Disable debug logging');
    console.log('  __debugLogger           - Access logger instance');
    console.log('\n%cURL Parameters:', 'font-weight: bold');
    console.log('  ?debug=true             - Enable debug mode');
    console.log('  ?debug_level=DEBUG      - Set debug level');
    console.log('\n%cExample:', 'font-weight: bold');
    console.log('  ' + window.location.origin + window.location.pathname + '?debug=true&debug_level=TRACE');
  };
}

export default logger;