import React from 'react';
import { Zap, Database, RefreshCw } from 'lucide-react';
import { useCache } from '../../contexts/CacheContext';

const CacheIndicator = ({ className = '' }) => {
  const { cacheStats, isWarmingCache } = useCache();

  if (isWarmingCache) {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-600 ${className}`}>
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Optimizing performance...</span>
      </div>
    );
  }

  // Only show if we have a good hit rate
  if (parseFloat(cacheStats.hitRate) > 50) {
    return (
      <div className={`flex items-center gap-2 text-xs text-green-600 ${className}`}>
        <Zap className="w-3 h-3" />
        <span>Fast mode active</span>
      </div>
    );
  }

  return null;
};

export default CacheIndicator;