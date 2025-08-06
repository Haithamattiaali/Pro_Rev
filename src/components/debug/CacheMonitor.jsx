import React, { useState, useEffect, useCallback, memo } from 'react';
import { Activity, Database, TrendingUp, X, Maximize2, Minimize2 } from 'lucide-react';
import dataService from '../../services/dataService';

const CacheMonitor = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    staleServed: 0,
    hitRate: '0%',
    cacheSize: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Update cache stats every second
  useEffect(() => {
    const updateStats = () => {
      const stats = dataService.getCacheStats();
      setCacheStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for cache events
  useEffect(() => {
    const handleCacheEvent = (event) => {
      const { type, key, isHit, age } = event.detail;
      setRecentActivity(prev => {
        const newActivity = {
          id: Date.now(),
          type,
          key: key.length > 30 ? key.substring(0, 30) + '...' : key,
          isHit,
          age: age ? `${Math.round(age / 1000)}s` : 'fresh',
          timestamp: new Date().toLocaleTimeString()
        };
        return [newActivity, ...prev.slice(0, 9)];
      });
    };

    window.addEventListener('cacheEvent', handleCacheEvent);
    return () => window.removeEventListener('cacheEvent', handleCacheEvent);
  }, []);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const clearCache = useCallback(() => {
    dataService.clearCache();
    setRecentActivity([]);
    setCacheStats({
      hits: 0,
      misses: 0,
      staleServed: 0,
      hitRate: '0%',
      cacheSize: 0
    });
  }, []);

  // Don't render in production or if not visible
  if (!isVisible || import.meta.env.PROD) {
    return null;
  }

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'top-20 right-4'} z-50 transition-all duration-300`}>
      <div className={`bg-gray-900 text-white rounded-lg shadow-2xl ${isMinimized ? 'w-48' : 'w-80'} overflow-hidden`}>
        {/* Header */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold">Cache Monitor</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Close (Ctrl+Shift+C)"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Stats */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Hit Rate</span>
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-green-400">{cacheStats.hitRate}</p>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Cache Size</span>
                    <Database className="w-3 h-3 text-blue-400" />
                  </div>
                  <p className="text-xl font-bold text-blue-400">{cacheStats.cacheSize}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">Hits</p>
                  <p className="text-lg font-semibold text-green-400">{cacheStats.hits}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Misses</p>
                  <p className="text-lg font-semibold text-red-400">{cacheStats.misses}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Stale</p>
                  <p className="text-lg font-semibold text-yellow-400">{cacheStats.staleServed}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase">Recent Activity</h3>
                  <Activity className="w-3 h-3 text-gray-400" />
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">No activity yet</p>
                  ) : (
                    recentActivity.map(activity => (
                      <div
                        key={activity.id}
                        className={`text-xs px-2 py-1 rounded flex items-center justify-between ${
                          activity.isHit ? 'bg-green-900/30' : 'bg-red-900/30'
                        }`}
                      >
                        <span className="truncate flex-1">{activity.key}</span>
                        <span className={`ml-2 ${activity.isHit ? 'text-green-400' : 'text-red-400'}`}>
                          {activity.isHit ? 'HIT' : 'MISS'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={clearCache}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 rounded transition-colors"
              >
                Clear Cache
              </button>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs">Hit Rate:</span>
            <span className="text-sm font-bold text-green-400">{cacheStats.hitRate}</span>
          </div>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      {!isMinimized && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Ctrl+Shift+C to toggle
        </div>
      )}
    </div>
  );
});

CacheMonitor.displayName = 'CacheMonitor';

export default CacheMonitor;