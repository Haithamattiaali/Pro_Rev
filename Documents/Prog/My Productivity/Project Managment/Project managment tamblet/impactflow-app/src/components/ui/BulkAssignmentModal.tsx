'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, User, AlertCircle, Search, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SimpleUser {
  id: string
  email: string
  name: string
  role: string
  teamId?: string
}

interface BulkAssignmentModalProps {
  taskCount: number
  currentAssignees: SimpleUser[]
  availableUsers: SimpleUser[]
  onConfirm: (userId: string) => Promise<void>
  onClose: () => void
}

export function BulkAssignmentModal({ 
  taskCount, 
  currentAssignees,
  availableUsers, 
  onConfirm, 
  onClose 
}: BulkAssignmentModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter users based on search
  const filteredUsers = availableUsers.filter(user => {
    const query = searchQuery.toLowerCase()
    return user.name.toLowerCase().includes(query) ||
           user.email.toLowerCase().includes(query) ||
           user.role?.toLowerCase().includes(query)
  })

  // Group users by role
  const usersByRole = filteredUsers.reduce((acc, user) => {
    const role = user.role || 'MEMBER'
    if (!acc[role]) acc[role] = []
    acc[role].push(user)
    return acc
  }, {} as Record<string, SimpleUser[]>)

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleConfirm = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(selectedUserId)
      const assignedUser = availableUsers.find(u => u.id === selectedUserId)
      toast.success(`Assigned ${taskCount} tasks to ${assignedUser?.name}`)
      onClose()
    } catch (error) {
      toast.error('Failed to assign tasks')
      console.error('Bulk assignment error:', error)
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

  // Get unique current assignees
  const uniqueAssignees = Array.from(new Map(currentAssignees.map(u => [u.id, u])).values())
  const hasMultipleAssignees = uniqueAssignees.length > 1
  const hasUnassigned = taskCount > currentAssignees.length

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b bg-neutral-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Bulk Assign Tasks</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Assign {taskCount} selected task{taskCount !== 1 ? 's' : ''} to a team member
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Current Assignment Info */}
          {(uniqueAssignees.length > 0 || hasUnassigned) && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <span className="font-medium">Current assignment{hasMultipleAssignees ? 's' : ''}:</span>
                  <div className="mt-1">
                    {uniqueAssignees.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {uniqueAssignees.slice(0, 3).map(user => (
                          <span key={user.id} className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {user.name}
                          </span>
                        ))}
                        {uniqueAssignees.length > 3 && (
                          <span className="text-xs">
                            +{uniqueAssignees.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                    {hasUnassigned && (
                      <div className="text-xs text-amber-600 mt-1">
                        {taskCount - currentAssignees.length} task{taskCount - currentAssignees.length !== 1 ? 's' : ''} unassigned
                      </div>
                    )}
                    {hasMultipleAssignees && (
                      <div className="text-xs text-amber-600 mt-1">(mixed assignments)</div>
                    )}
                  </div>
                </div>
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
          <div className="flex-1 px-6 py-4 overflow-y-auto">
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
                                  <CheckCircle className="w-3 h-3 text-white" />
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
                  className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!selectedUserId || isLoading}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    `Assign ${taskCount} Task${taskCount !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}