'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Shield, X } from 'lucide-react';

export function DevBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = React.useState(true);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development' || !isVisible || !user) {
    return null;
  }

  return (
    <div className="bg-yellow-400 border-b-2 border-yellow-600 px-4 py-2 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-yellow-800" />
          <div className="text-sm font-medium text-yellow-900">
            <span className="font-bold">DEV MODE:</span> Logged in as{' '}
            <span className="font-bold">{user.name}</span> (
            <span className="font-bold text-yellow-800">{user.role.name}</span>)
          </div>
          <div className="text-xs text-yellow-700">
            {user.permissions.length} permissions • {user.email}
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-yellow-800 hover:text-yellow-900 p-1"
          title="Hide banner (will reappear on page refresh)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}