import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Resource, Action, Scope } from '../../types/auth';

interface PermissionGateProps {
  children: React.ReactNode;
  resource: Resource;
  action: Action;
  scope?: Scope;
  fallback?: React.ReactNode;
  showError?: boolean;
  resourceOwnerId?: string;
  resourceTeamId?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  resource,
  action,
  scope,
  fallback = null,
  showError = false,
  resourceOwnerId,
  resourceTeamId,
}) => {
  const { can, getResourceScope } = usePermissions();
  
  // Determine the appropriate scope based on resource ownership
  const effectiveScope = scope || getResourceScope(resourceOwnerId, resourceTeamId);
  
  const hasPermission = can(resource, action, effectiveScope);
  
  if (!hasPermission) {
    if (showError) {
      return (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          You don't have permission to {action} {resource}.
        </div>
      );
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};