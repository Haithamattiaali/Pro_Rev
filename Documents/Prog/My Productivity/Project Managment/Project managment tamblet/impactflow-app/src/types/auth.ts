export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  permissions: Permission[];
  teamId?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  permissions: Permission[];
  level: number; // For hierarchy (Admin = 0, PM = 1, etc.)
}

export type RoleName = 'Admin' | 'Project Manager' | 'Team Lead' | 'Developer' | 'Viewer';

export interface Permission {
  id: string;
  resource: Resource;
  action: Action;
  scope?: Scope;
}

export type Resource = 
  | 'tasks'
  | 'projects'
  | 'reports'
  | 'team'
  | 'users'
  | 'settings'
  | 'system_settings'
  | 'analytics'
  | 'approvals';

export type Action = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'assign'
  | 'export'
  | 'manage';

export type Scope = 'own' | 'team' | 'all';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

// Predefined roles with their permissions
export const ROLES: Record<RoleName, Omit<Role, 'id'>> = {
  Admin: {
    name: 'Admin',
    description: 'Full system access',
    level: 0,
    permissions: [
      { id: '1', resource: 'tasks', action: 'create', scope: 'all' },
      { id: '2', resource: 'tasks', action: 'read', scope: 'all' },
      { id: '3', resource: 'tasks', action: 'update', scope: 'all' },
      { id: '4', resource: 'tasks', action: 'delete', scope: 'all' },
      { id: '5', resource: 'tasks', action: 'assign', scope: 'all' },
      { id: '6', resource: 'projects', action: 'create', scope: 'all' },
      { id: '7', resource: 'projects', action: 'read', scope: 'all' },
      { id: '8', resource: 'projects', action: 'update', scope: 'all' },
      { id: '9', resource: 'projects', action: 'delete', scope: 'all' },
      { id: '10', resource: 'reports', action: 'create', scope: 'all' },
      { id: '11', resource: 'reports', action: 'read', scope: 'all' },
      { id: '12', resource: 'reports', action: 'export', scope: 'all' },
      { id: '13', resource: 'team', action: 'manage', scope: 'all' },
      { id: '14', resource: 'users', action: 'create', scope: 'all' },
      { id: '15', resource: 'users', action: 'read', scope: 'all' },
      { id: '16', resource: 'users', action: 'update', scope: 'all' },
      { id: '17', resource: 'users', action: 'delete', scope: 'all' },
      { id: '18', resource: 'settings', action: 'manage', scope: 'all' },
      { id: '19', resource: 'system_settings', action: 'manage', scope: 'all' },
      { id: '20', resource: 'analytics', action: 'read', scope: 'all' },
      { id: '21', resource: 'approvals', action: 'approve', scope: 'all' },
    ],
  },
  'Project Manager': {
    name: 'Project Manager',
    description: 'Manage projects and teams',
    level: 1,
    permissions: [
      { id: '22', resource: 'tasks', action: 'create', scope: 'all' },
      { id: '23', resource: 'tasks', action: 'read', scope: 'all' },
      { id: '24', resource: 'tasks', action: 'update', scope: 'all' },
      { id: '25', resource: 'tasks', action: 'delete', scope: 'all' },
      { id: '26', resource: 'tasks', action: 'assign', scope: 'all' },
      { id: '27', resource: 'projects', action: 'create', scope: 'team' },
      { id: '28', resource: 'projects', action: 'read', scope: 'all' },
      { id: '29', resource: 'projects', action: 'update', scope: 'team' },
      { id: '30', resource: 'reports', action: 'create', scope: 'all' },
      { id: '31', resource: 'reports', action: 'read', scope: 'all' },
      { id: '32', resource: 'reports', action: 'export', scope: 'all' },
      { id: '33', resource: 'team', action: 'manage', scope: 'team' },
      { id: '34', resource: 'users', action: 'read', scope: 'team' },
      { id: '35', resource: 'analytics', action: 'read', scope: 'team' },
      { id: '36', resource: 'approvals', action: 'approve', scope: 'team' },
    ],
  },
  'Team Lead': {
    name: 'Team Lead',
    description: 'Lead team activities',
    level: 2,
    permissions: [
      { id: '36', resource: 'tasks', action: 'create', scope: 'team' },
      { id: '37', resource: 'tasks', action: 'read', scope: 'team' },
      { id: '38', resource: 'tasks', action: 'update', scope: 'team' },
      { id: '39', resource: 'tasks', action: 'assign', scope: 'team' },
      { id: '40', resource: 'projects', action: 'read', scope: 'team' },
      { id: '41', resource: 'reports', action: 'read', scope: 'team' },
      { id: '42', resource: 'reports', action: 'export', scope: 'team' },
      { id: '43', resource: 'team', action: 'read', scope: 'team' },
      { id: '44', resource: 'analytics', action: 'read', scope: 'team' },
      { id: '45', resource: 'approvals', action: 'approve', scope: 'own' },
    ],
  },
  Developer: {
    name: 'Developer',
    description: 'Manage assigned tasks',
    level: 3,
    permissions: [
      { id: '46', resource: 'tasks', action: 'read', scope: 'team' },
      { id: '47', resource: 'tasks', action: 'update', scope: 'own' },
      { id: '48', resource: 'tasks', action: 'create', scope: 'own' },
      { id: '49', resource: 'projects', action: 'read', scope: 'team' },
      { id: '50', resource: 'reports', action: 'read', scope: 'team' },
      { id: '51', resource: 'team', action: 'read', scope: 'team' },
    ],
  },
  Viewer: {
    name: 'Viewer',
    description: 'Read-only access',
    level: 4,
    permissions: [
      { id: '52', resource: 'tasks', action: 'read', scope: 'team' },
      { id: '53', resource: 'projects', action: 'read', scope: 'team' },
      { id: '54', resource: 'reports', action: 'read', scope: 'team' },
      { id: '55', resource: 'team', action: 'read', scope: 'team' },
    ],
  },
};