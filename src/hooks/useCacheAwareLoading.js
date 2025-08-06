import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Cache-aware loading hook that only shows loading for actual network requests
 * @param {number} initialDelay - Delay before showing loading indicator (ms)
 * @returns {Object} Loading state and control functions
 */
export const useCacheAwareLoading = (initialDelay = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const startLoading = useCallback((isFromCache = false) => {
    if (!isFromCache) {
      setIsLoading(true);
      
      // Only show loading indicator after delay
      loadingTimerRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShowLoading(true);
        }
      }, initialDelay);
    }
  }, [initialDelay]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
    
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  // Method to handle cache result and determine loading
  const handleCacheResult = useCallback((result) => {
    if (result && result.isFromCache) {
      // Don't show loading for cache hits
      return false;
    }
    // Show loading for network requests
    startLoading(false);
    return true;
  }, [startLoading]);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading,
    handleCacheResult
  };
};