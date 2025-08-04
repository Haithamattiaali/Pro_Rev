import { useState, useEffect, useRef, useCallback } from 'react';
import { useCache } from '../contexts/CacheContext';

/**
 * Optimized loading hook that prevents flashing loading states
 * for cached data and provides smooth transitions
 */
export const useOptimizedLoading = (initialLoading = true) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const minimumLoadingTimeRef = useRef(null);
  const { isWarmingCache } = useCache();
  
  // Delay showing loading state by 100ms to prevent flashing
  const LOADING_DELAY = 100;
  // Minimum time to show loading state once visible
  const MINIMUM_LOADING_TIME = 300;
  
  useEffect(() => {
    if (isLoading && !isWarmingCache) {
      // Start timer to show loading state
      loadingTimeoutRef.current = setTimeout(() => {
        setShowLoading(true);
        // Once loading is shown, ensure it stays for minimum time
        minimumLoadingTimeRef.current = Date.now() + MINIMUM_LOADING_TIME;
      }, LOADING_DELAY);
    } else {
      // Clear the loading delay timeout if loading finished quickly
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Check if we need to maintain minimum loading time
      if (showLoading && minimumLoadingTimeRef.current) {
        const remainingTime = minimumLoadingTimeRef.current - Date.now();
        if (remainingTime > 0) {
          setTimeout(() => {
            setShowLoading(false);
            minimumLoadingTimeRef.current = null;
          }, remainingTime);
        } else {
          setShowLoading(false);
          minimumLoadingTimeRef.current = null;
        }
      } else {
        setShowLoading(false);
      }
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, isWarmingCache]);
  
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Return whether to actually show loading state
  return {
    isLoading: showLoading || isWarmingCache,
    showLoading: showLoading || isWarmingCache,
    startLoading,
    stopLoading,
    isWarmingCache
  };
};

/**
 * Hook for managing multiple loading states
 */
export const useMultipleLoading = () => {
  const [loadingStates, setLoadingStates] = useState(new Set());
  const { isWarmingCache } = useCache();
  
  const addLoading = useCallback((key) => {
    setLoadingStates(prev => new Set(prev).add(key));
  }, []);
  
  const removeLoading = useCallback((key) => {
    setLoadingStates(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);
  
  const clearAllLoading = useCallback(() => {
    setLoadingStates(new Set());
  }, []);
  
  const isAnyLoading = loadingStates.size > 0 || isWarmingCache;
  const isLoading = useCallback((key) => loadingStates.has(key), [loadingStates]);
  
  return {
    isAnyLoading,
    isLoading,
    addLoading,
    removeLoading,
    clearAllLoading,
    loadingCount: loadingStates.size,
    isWarmingCache
  };
};