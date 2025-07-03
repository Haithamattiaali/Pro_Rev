'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { Resource, Action, Scope, RoleName } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requirePermission?: {
    resource: Resource;
    action: Action;
    scope?: Scope;
  };
  requireRole?: RoleName | RoleName[];
  requireMinimumRole?: RoleName;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requirePermission,
  requireRole,
  requireMinimumRole,
  fallback,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { can } = usePermissions();
  const { hasRole, hasMinimumRole } = useRoleAccess();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, pathname, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null; // Return null while redirecting
  }
  
  // Check permission
  if (requirePermission && !can(requirePermission.resource, requirePermission.action, requirePermission.scope)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check role
  if (requireRole && !hasRole(requireRole)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Role</h2>
          <p className="text-gray-600">Your role doesn't have access to this feature.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Check minimum role
  if (requireMinimumRole && !hasMinimumRole(requireMinimumRole)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Privileges</h2>
          <p className="text-gray-600">This feature requires at least {requireMinimumRole} role.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};