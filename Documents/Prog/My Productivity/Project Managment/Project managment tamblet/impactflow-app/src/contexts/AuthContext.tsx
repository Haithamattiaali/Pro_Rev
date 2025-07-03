import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, LoginCredentials, AuthState, Permission, Resource, Action, Scope, ROLES, RoleName } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkPermission: (resource: Resource, action: Action, scope?: Scope) => boolean;
  hasRole: (role: RoleName | RoleName[]) => boolean;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS: Record<string, User> = {
  'admin@impactflow.com': {
    id: '1',
    email: 'admin@impactflow.com',
    name: 'Admin User',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488&color=fff',
    role: {
      id: 'role-1',
      ...ROLES.Admin,
    },
    permissions: ROLES.Admin.permissions,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
  },
  'pm@impactflow.com': {
    id: '2',
    email: 'pm@impactflow.com',
    name: 'Project Manager',
    avatar: 'https://ui-avatars.com/api/?name=Project+Manager&background=3B82F6&color=fff',
    role: {
      id: 'role-2',
      ...ROLES['Project Manager'],
    },
    permissions: ROLES['Project Manager'].permissions,
    teamId: 'team-1',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
  },
  'lead@impactflow.com': {
    id: '3',
    email: 'lead@impactflow.com',
    name: 'Team Lead',
    avatar: 'https://ui-avatars.com/api/?name=Team+Lead&background=8B5CF6&color=fff',
    role: {
      id: 'role-3',
      ...ROLES['Team Lead'],
    },
    permissions: ROLES['Team Lead'].permissions,
    teamId: 'team-1',
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date(),
  },
  'dev@impactflow.com': {
    id: '4',
    email: 'dev@impactflow.com',
    name: 'Developer',
    avatar: 'https://ui-avatars.com/api/?name=Developer&background=EC4899&color=fff',
    role: {
      id: 'role-4',
      ...ROLES.Developer,
    },
    permissions: ROLES.Developer.permissions,
    teamId: 'team-1',
    createdAt: new Date('2024-02-15'),
    lastLogin: new Date(),
  },
  'viewer@impactflow.com': {
    id: '5',
    email: 'viewer@impactflow.com',
    name: 'Viewer',
    avatar: 'https://ui-avatars.com/api/?name=Viewer&background=6B7280&color=fff',
    role: {
      id: 'role-5',
      ...ROLES.Viewer,
    },
    permissions: ROLES.Viewer.permissions,
    teamId: 'team-1',
    createdAt: new Date('2024-03-01'),
    lastLogin: new Date(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Check for stored auth on mount or auto-login in development
  useEffect(() => {
    // Auto-login in development mode
    if (process.env.NEXT_PUBLIC_AUTO_LOGIN === 'true' && process.env.NODE_ENV === 'development') {
      const autoLoginEmail = process.env.NEXT_PUBLIC_AUTO_LOGIN_EMAIL || 'admin@impactflow.com';
      const autoLoginUser = MOCK_USERS[autoLoginEmail];
      
      if (autoLoginUser) {
        console.log('🔐 Auto-login enabled: Logging in as', autoLoginUser.name, '(', autoLoginUser.role.name, ')');
        
        // Update last login
        autoLoginUser.lastLogin = new Date();
        
        // Store auth in localStorage
        const authData = {
          user: autoLoginUser,
          token: `mock-token-${autoLoginUser.id}-${Date.now()}`,
        };
        localStorage.setItem('impactflow_auth', JSON.stringify(authData));
        
        setAuthState({
          user: autoLoginUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }
    }
    
    // Normal auth check
    const storedAuth = localStorage.getItem('impactflow_auth');
    if (storedAuth) {
      try {
        const { user, token } = JSON.parse(storedAuth);
        if (user && token) {
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem('impactflow_auth');
      }
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = MOCK_USERS[credentials.email];
      
      if (!user || credentials.password !== 'password') {
        throw new Error('Invalid email or password');
      }
      
      // Update last login
      user.lastLogin = new Date();
      
      // Store auth in localStorage
      const authData = {
        user,
        token: `mock-token-${user.id}-${Date.now()}`,
      };
      localStorage.setItem('impactflow_auth', JSON.stringify(authData));
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('impactflow_auth');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const checkPermission = useCallback((resource: Resource, action: Action, scope?: Scope): boolean => {
    if (!authState.user) return false;
    
    const userPermissions = authState.user.permissions;
    
    return userPermissions.some(permission => {
      // Check resource and action match
      if (permission.resource !== resource || permission.action !== action) {
        return false;
      }
      
      // If no scope is required, permission is granted
      if (!scope) return true;
      
      // Check scope hierarchy: 'all' > 'team' > 'own'
      if (permission.scope === 'all') return true;
      if (permission.scope === 'team' && (scope === 'team' || scope === 'own')) return true;
      if (permission.scope === 'own' && scope === 'own') return true;
      
      return false;
    });
  }, [authState.user]);

  const hasRole = useCallback((role: RoleName | RoleName[]): boolean => {
    if (!authState.user) return false;
    
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(authState.user.role.name);
  }, [authState.user]);

  const updateUser = useCallback((user: User) => {
    setAuthState(prev => ({ ...prev, user }));
    
    // Update stored auth
    const storedAuth = localStorage.getItem('impactflow_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        authData.user = user;
        localStorage.setItem('impactflow_auth', JSON.stringify(authData));
      } catch (error) {
        console.error('Failed to update stored auth:', error);
      }
    }
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    checkPermission,
    hasRole,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};