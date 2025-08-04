import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import dataService from '../services/dataService';

const CacheContext = createContext();

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

export const CacheProvider = ({ children }) => {
  const [isWarmingCache, setIsWarmingCache] = useState(true);
  const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0, staleServed: 0, hitRate: '0%' });
  const [loadingKeys, setLoadingKeys] = useState(new Set());

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      setCacheStats(dataService.getCacheStats());
    };

    // Initial stats
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  // Track when cache warming completes
  useEffect(() => {
    // Give cache warming 3 seconds to complete
    const timer = setTimeout(() => {
      setIsWarmingCache(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Track loading states
  const setLoading = useCallback((key, isLoading) => {
    setLoadingKeys(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  }, []);

  // Check if any key is loading
  const isAnyLoading = loadingKeys.size > 0;

  // Check if a specific key is loading
  const isKeyLoading = useCallback((key) => {
    return loadingKeys.has(key);
  }, [loadingKeys]);

  // Clear all cache
  const clearCache = useCallback(() => {
    dataService.clearCache();
    setCacheStats({ hits: 0, misses: 0, staleServed: 0, hitRate: '0%' });
  }, []);

  // Clear cache for specific year
  const clearCacheForYear = useCallback((year) => {
    dataService.clearCacheForYear(year);
  }, []);

  const value = {
    isWarmingCache,
    cacheStats,
    isAnyLoading,
    isKeyLoading,
    setLoading,
    clearCache,
    clearCacheForYear
  };

  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
};