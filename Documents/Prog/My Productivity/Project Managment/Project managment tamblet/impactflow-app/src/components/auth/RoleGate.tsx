import React from 'react';
import { useRoleAccess } from '../../hooks/useRoleAccess';
import { RoleName } from '../../types/auth';

interface RoleGateProps {
  children: React.ReactNode;
  roles?: RoleName | RoleName[];
  minimumRole?: RoleName;
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  children,
  roles,
  minimumRole,
  fallback = null,
  showError = false,
}) => {
  const { hasRole, hasMinimumRole } = useRoleAccess();
  
  let hasAccess = true;
  
  if (roles) {
    hasAccess = hasRole(roles);
  }
  
  if (minimumRole && hasAccess) {
    hasAccess = hasMinimumRole(minimumRole);
  }
  
  if (!hasAccess) {
    if (showError) {
      return (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          Your role doesn't have access to this feature.
        </div>
      );
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};