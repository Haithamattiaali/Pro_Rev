'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, User, Users, Check, AlertCircle } from 'lucide-react'
import { Task } from '@/types/project'
import toast from 'react-hot-toast'

// Simplified user type for assignment
interface SimpleUser {
  id: string
  email: string
  name: string
  role: string
  teamId?: string
}

interface TaskAssignmentModalProps {
  task: Task
  currentAssignee?: SimpleUser
  availableUsers: SimpleUser[]
  onAssign: (taskId: string, userId: string) => void
  onClose: () => void
}

export function TaskAssignmentModal({ 
  task, 
  currentAssignee, 
  availableUsers, 
  onAssign, 
  onClose 
}: TaskAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(currentAssignee?.id || null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return availableUsers

    const query = searchQuery.toLowerCase()
    return availableUsers.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    )
  }, [availableUsers, searchQuery])

  // Group users by role
  const usersByRole = useMemo(() => {
    const grouped = filteredUsers.reduce((acc, user) => {
      const role = user.role || 'MEMBER'
      if (!acc[role]) {
        acc[role] = []
      }
      acc[role].push(user)
      return acc
    }, {} as Record<string, SimpleUser[]>)

    return grouped
  }, [filteredUsers])

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user to assign')
      return
    }

    if (selectedUserId === currentAssignee?.id) {
      toast.error('Task is already assigned to this user')
      return
    }

    setIsLoading(true)
    try {
      await onAssign(task.id, selectedUserId)
      const assignedUser = availableUsers.find(u => u.id === selectedUserId)
      toast.success(`Task assigned to ${assignedUser?.name}`)
      onClose()
    } catch (error) {
      toast.error('Failed to assign task')
      console.error('Assignment error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
      case 'PROJECT_MANAGER':
        return 'bg-purple-100 text-purple-700'
      case 'TEAM_LEAD':
        return 'bg-blue-100 text-blue-700'
      case 'DEVELOPER':
      case 'MEMBER':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleDisplayName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Assign Task</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Select a team member to assign "{task.name}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Assignment Info */}
        {currentAssignee && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800">
                Currently assigned to <strong>{currentAssignee.name}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="px-6 py-4 overflow-y-auto max-h-[400px]">
          {Object.keys(usersByRole).length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No users found matching your search
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(usersByRole).map(([role, users]) => (
                <div key={role}>
                  <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {getRoleDisplayName(role)}
                    <span className="text-neutral-400">({users.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <motion.button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all ${
                          selectedUserId === user.id
                            ? 'border-primary bg-primary-50'
                            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-700" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-neutral-900">
                                {user.name}
                                {user.id === currentAssignee?.id && (
                                  <span className="ml-2 text-xs text-amber-600">(Current)</span>
                                )}
                              </div>
                              <div className="text-sm text-neutral-600">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role || 'MEMBER')}`}>
                              {getRoleDisplayName(user.role || 'MEMBER')}
                            </span>
                            {selectedUserId === user.id && (
                              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-neutral-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-600">
              {selectedUserId && (
                <span>
                  Assigning to: <strong>{availableUsers.find(u => u.id === selectedUserId)?.name}</strong>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedUserId || selectedUserId === currentAssignee?.id || isLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Task'
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}