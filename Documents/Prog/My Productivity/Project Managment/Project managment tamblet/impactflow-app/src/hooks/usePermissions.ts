import { useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { Resource, Action, Scope } from '../types/auth';

export const usePermissions = () => {
  const { user, checkPermission } = useAuthContext();
  
  const can = useCallback((resource: Resource, action: Action, scope?: Scope): boolean => {
    return checkPermission(resource, action, scope);
  }, [checkPermission]);
  
  const cannot = useCallback((resource: Resource, action: Action, scope?: Scope): boolean => {
    return !checkPermission(resource, action, scope);
  }, [checkPermission]);
  
  // Convenience methods for common checks
  const canCreate = useCallback((resource: Resource, scope?: Scope) => can(resource, 'create', scope), [can]);
  const canRead = useCallback((resource: Resource, scope?: Scope) => can(resource, 'read', scope), [can]);
  const canUpdate = useCallback((resource: Resource, scope?: Scope) => can(resource, 'update', scope), [can]);
  const canDelete = useCallback((resource: Resource, scope?: Scope) => can(resource, 'delete', scope), [can]);
  const canManage = useCallback((resource: Resource, scope?: Scope) => can(resource, 'manage', scope), [can]);
  const canApprove = useCallback((resource: Resource, scope?: Scope) => can(resource, 'approve', scope), [can]);
  const canAssign = useCallback((resource: Resource, scope?: Scope) => can(resource, 'assign', scope), [can]);
  const canExport = useCallback((resource: Resource, scope?: Scope) => can(resource, 'export', scope), [can]);
  
  // Check if user owns a resource
  const isOwner = useCallback((resourceOwnerId?: string): boolean => {
    return !!user && resourceOwnerId === user.id;
  }, [user]);
  
  // Check if resource belongs to user's team
  const isTeamResource = useCallback((resourceTeamId?: string): boolean => {
    return !!user && !!user.teamId && resourceTeamId === user.teamId;
  }, [user]);
  
  // Get appropriate scope for a resource
  const getResourceScope = useCallback((resourceOwnerId?: string, resourceTeamId?: string): Scope => {
    if (isOwner(resourceOwnerId)) return 'own';
    if (isTeamResource(resourceTeamId)) return 'team';
    return 'all';
  }, [isOwner, isTeamResource]);
  
  return {
    can,
    cannot,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    canApprove,
    canAssign,
    canExport,
    isOwner,
    isTeamResource,
    getResourceScope,
    checkPermission,
  };
};