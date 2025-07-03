import React, { useState } from 'react';
import { User, RoleName, ROLES, Permission } from '../../types/auth';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../auth/PermissionGate';

interface RoleAssignmentProps {
  user: User;
  onUpdate?: (user: User) => void;
  compact?: boolean;
}

export const RoleAssignment: React.FC<RoleAssignmentProps> = ({ 
  user, 
  onUpdate,
  compact = false 
}) => {
  const { canManage } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<RoleName>(user.role.name);
  const [showPermissions, setShowPermissions] = useState(false);
  
  const handleRoleChange = (newRole: RoleName) => {
    setSelectedRole(newRole);
    if (onUpdate) {
      const updatedUser: User = {
        ...user,
        role: {
          id: `role-${newRole.toLowerCase().replace(' ', '-')}`,
          ...ROLES[newRole],
        },
        permissions: ROLES[newRole].permissions,
      };
      onUpdate(updatedUser);
    }
  };
  
  const getRoleDescription = (role: RoleName): string => {
    return ROLES[role].description;
  };
  
  const getPermissionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      create: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
      read: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      update: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      delete: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
      approve: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      assign: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      export: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      manage: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    };
    return icons[action] || '';
  };
  
  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    return grouped;
  };
  
  if (compact) {
    return (
      <PermissionGate resource="users" action="update">
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value as RoleName)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={!canManage('users')}
        >
          {Object.keys(ROLES).map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </PermissionGate>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role Assignment</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Role
            </label>
            <PermissionGate 
              resource="users" 
              action="update"
              fallback={
                <div className="text-sm text-gray-900 font-medium">
                  {user.role.name}
                </div>
              }
            >
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value as RoleName)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {Object.keys(ROLES).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </PermissionGate>
            <p className="mt-1 text-sm text-gray-500">
              {getRoleDescription(selectedRole)}
            </p>
          </div>
          
          <div>
            <button
              type="button"
              onClick={() => setShowPermissions(!showPermissions)}
              className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <svg 
                className={`mr-1 h-4 w-4 transform transition-transform ${showPermissions ? 'rotate-90' : ''}`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View Permissions ({ROLES[selectedRole].permissions.length})
            </button>
          </div>
        </div>
      </div>
      
      {showPermissions && (
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Permissions for {selectedRole}
          </h4>
          
          <div className="space-y-4">
            {Object.entries(groupPermissionsByResource(ROLES[selectedRole].permissions)).map(([resource, permissions]) => (
              <div key={resource} className="border rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 capitalize mb-2">
                  {resource}
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {permissions.map((permission) => (
                    <div 
                      key={permission.id}
                      className="flex items-center text-xs text-gray-600"
                    >
                      <svg 
                        className="h-4 w-4 mr-1 text-green-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={getPermissionIcon(permission.action) || 'M5 13l4 4L19 7'}
                        />
                      </svg>
                      <span className="capitalize">
                        {permission.action}
                        {permission.scope && permission.scope !== 'all' && (
                          <span className="text-gray-400 ml-1">({permission.scope})</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Permission Scopes</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div><span className="font-medium">All:</span> Can perform action on any resource</div>
              <div><span className="font-medium">Team:</span> Can perform action on team resources only</div>
              <div><span className="font-medium">Own:</span> Can perform action on owned resources only</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};