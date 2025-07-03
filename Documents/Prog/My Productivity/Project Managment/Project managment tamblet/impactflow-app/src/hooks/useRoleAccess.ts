import { useAuthContext } from '../contexts/AuthContext';
import { RoleName } from '../types/auth';

export const useRoleAccess = () => {
  const { user, hasRole } = useAuthContext();
  
  const isAdmin = () => hasRole('Admin');
  const isProjectManager = () => hasRole('Project Manager');
  const isTeamLead = () => hasRole('Team Lead');
  const isDeveloper = () => hasRole('Developer');
  const isViewer = () => hasRole('Viewer');
  
  const hasAnyRole = (roles: RoleName[]) => hasRole(roles);
  
  const hasMinimumRole = (minimumRole: RoleName): boolean => {
    if (!user) return false;
    
    const roleHierarchy: Record<RoleName, number> = {
      'Admin': 0,
      'Project Manager': 1,
      'Team Lead': 2,
      'Developer': 3,
      'Viewer': 4,
    };
    
    const userRoleLevel = roleHierarchy[user.role.name];
    const minimumRoleLevel = roleHierarchy[minimumRole];
    
    return userRoleLevel <= minimumRoleLevel;
  };
  
  const getRoleLevel = (): number => {
    return user?.role.level ?? Infinity;
  };
  
  const getRoleName = (): RoleName | null => {
    return user?.role.name ?? null;
  };
  
  return {
    isAdmin,
    isProjectManager,
    isTeamLead,
    isDeveloper,
    isViewer,
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    getRoleLevel,
    getRoleName,
  };
};