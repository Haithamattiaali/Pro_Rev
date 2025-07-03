import React, { useState } from 'react';
import { User, RoleName, ROLES } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../auth/PermissionGate';

interface UserManagementProps {
  users?: User[];
}

export const UserManagement: React.FC<UserManagementProps> = ({ users: propUsers }) => {
  const { user: currentUser } = useAuth();
  const { canUpdate, canDelete, canCreate } = usePermissions();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Mock users for demonstration
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'admin@impactflow.com',
      name: 'Admin User',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D9488&color=fff',
      role: { id: 'role-1', ...ROLES.Admin },
      permissions: ROLES.Admin.permissions,
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date(),
    },
    {
      id: '2',
      email: 'pm@impactflow.com',
      name: 'Project Manager',
      avatar: 'https://ui-avatars.com/api/?name=Project+Manager&background=3B82F6&color=fff',
      role: { id: 'role-2', ...ROLES['Project Manager'] },
      permissions: ROLES['Project Manager'].permissions,
      teamId: 'team-1',
      createdAt: new Date('2024-01-15'),
      lastLogin: new Date(),
    },
    {
      id: '3',
      email: 'lead@impactflow.com',
      name: 'Team Lead',
      avatar: 'https://ui-avatars.com/api/?name=Team+Lead&background=8B5CF6&color=fff',
      role: { id: 'role-3', ...ROLES['Team Lead'] },
      permissions: ROLES['Team Lead'].permissions,
      teamId: 'team-1',
      createdAt: new Date('2024-02-01'),
      lastLogin: new Date(),
    },
    {
      id: '4',
      email: 'dev@impactflow.com',
      name: 'Developer',
      avatar: 'https://ui-avatars.com/api/?name=Developer&background=EC4899&color=fff',
      role: { id: 'role-4', ...ROLES.Developer },
      permissions: ROLES.Developer.permissions,
      teamId: 'team-1',
      createdAt: new Date('2024-02-15'),
      lastLogin: new Date(),
    },
    {
      id: '5',
      email: 'viewer@impactflow.com',
      name: 'Viewer',
      avatar: 'https://ui-avatars.com/api/?name=Viewer&background=6B7280&color=fff',
      role: { id: 'role-5', ...ROLES.Viewer },
      permissions: ROLES.Viewer.permissions,
      teamId: 'team-1',
      createdAt: new Date('2024-03-01'),
      lastLogin: new Date(),
    },
  ];
  
  const users = propUsers || mockUsers;
  
  const getRoleBadgeColor = (role: RoleName): string => {
    const colors: Record<RoleName, string> = {
      'Admin': 'bg-red-100 text-red-800',
      'Project Manager': 'bg-blue-100 text-blue-800',
      'Team Lead': 'bg-purple-100 text-purple-800',
      'Developer': 'bg-green-100 text-green-800',
      'Viewer': 'bg-gray-100 text-gray-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };
  
  const getStatusBadge = (lastLogin?: Date) => {
    if (!lastLogin) return { text: 'Never', color: 'bg-gray-100 text-gray-800' };
    
    const hoursSinceLogin = (new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLogin < 1) {
      return { text: 'Active', color: 'bg-green-100 text-green-800' };
    } else if (hoursSinceLogin < 24) {
      return { text: 'Today', color: 'bg-blue-100 text-blue-800' };
    } else if (hoursSinceLogin < 168) {
      return { text: 'This week', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">User Management</h3>
            <p className="mt-1 text-sm text-gray-500">Manage users and their roles</p>
          </div>
          <PermissionGate resource="users" action="create">
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <svg className="mr-2 -ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite User
            </button>
          </PermissionGate>
        </div>
      </div>
      
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const status = getStatusBadge(user.lastLogin);
              const isCurrentUser = currentUser?.id === user.id;
              
              return (
                <tr key={user.id} className={isCurrentUser ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role.name)}`}>
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.teamId ? `Team ${user.teamId.split('-')[1]}` : 'No team'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <PermissionGate resource="users" action="update">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={isCurrentUser}
                        >
                          Edit
                        </button>
                      </PermissionGate>
                      <PermissionGate resource="users" action="delete">
                        <button
                          onClick={() => console.log('Delete user:', user.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isCurrentUser}
                        >
                          Delete
                        </button>
                      </PermissionGate>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}
      
      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
};

const InviteUserModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'Viewer' as RoleName,
    teamId: '',
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invite user:', formData);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleName })}
            >
              {Object.keys(ROLES).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team (Optional)</label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="team-1"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role.name,
    teamId: user.teamId || '',
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Update user:', user.id, formData);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              disabled
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
              value={user.email}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleName })}
            >
              {Object.keys(ROLES).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Team</label>
            <input
              type="text"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="team-1"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};