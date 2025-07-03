'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, MessageSquare, CheckCircle, XCircle, Clock,
  Send, Paperclip, AtSign, Hash, Flag, AlertCircle,
  ThumbsUp, ThumbsDown, Eye, Edit3, Trash2, Wifi, WifiOff, Lock
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Image from 'next/image'
import { Task, User as ProjectUser } from '@/types/project'
import toast from 'react-hot-toast'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { usePermissions } from '@/hooks/usePermissions'
import { useRoleAccess } from '@/hooks/useRoleAccess'
import { PermissionGate } from '@/components/auth/PermissionGate'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
  avatar?: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: Date
}

interface Approval {
  id: string
  taskId: string
  taskName: string
  requestedBy: TeamMember
  requestedAt: Date
  type: 'task_completion' | 'budget_increase' | 'timeline_extension' | 'scope_change'
  description: string
  currentValue?: string
  requestedValue?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: TeamMember
  reviewedAt?: Date
  comments: Comment[]
}

interface Comment {
  id: string
  author: TeamMember
  content: string
  timestamp: Date
  attachments?: string[]
  mentions?: string[]
  reactions?: { type: string; users: string[] }[]
}

interface Update {
  id: string
  type: 'task_update' | 'approval_request' | 'mention' | 'comment'
  title: string
  description: string
  timestamp: Date
  read: boolean
  relatedTask?: Task
  relatedApproval?: Approval
  author: TeamMember
}

interface TeamCollaborationProps {
  tasks: Task[]
  currentUser?: TeamMember
  projectId?: string
}

// Mock data for demonstration
const mockTeamMembers: TeamMember[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'online' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'manager', status: 'online' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'member', status: 'away' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'member', status: 'offline', lastSeen: new Date(Date.now() - 3600000) },
]

const mockApprovals: Approval[] = [
  {
    id: 'A1',
    taskId: 'C005',
    taskName: 'API Development',
    requestedBy: mockTeamMembers[2],
    requestedAt: new Date(Date.now() - 86400000),
    type: 'timeline_extension',
    description: 'Need 5 additional days due to infrastructure dependency issues',
    currentValue: '21 days',
    requestedValue: '26 days',
    status: 'pending',
    comments: [
      {
        id: 'C1',
        author: mockTeamMembers[1],
        content: 'Can we reduce the extension to 3 days by adding more resources?',
        timestamp: new Date(Date.now() - 3600000),
        reactions: [{ type: '👍', users: ['3'] }]
      }
    ]
  },
  {
    id: 'A2',
    taskId: 'C004',
    taskName: 'Infrastructure Setup',
    requestedBy: mockTeamMembers[1],
    requestedAt: new Date(Date.now() - 172800000),
    type: 'budget_increase',
    description: 'Additional security requirements require upgraded infrastructure',
    currentValue: '$250,000',
    requestedValue: '$280,000',
    status: 'approved',
    reviewedBy: mockTeamMembers[0],
    reviewedAt: new Date(Date.now() - 86400000),
    comments: []
  }
]

export function TeamCollaboration({ tasks, currentUser = mockTeamMembers[0], projectId }: TeamCollaborationProps) {
  const { canApprove, canManage, canCreate } = usePermissions()
  const { hasMinimumRole } = useRoleAccess()
  
  const [activeTab, setActiveTab] = useState<'team' | 'approvals' | 'updates'>('team')
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [newComment, setNewComment] = useState('')
  const [showNewApproval, setShowNewApproval] = useState(false)

  // Real-time updates
  const { onlineUsers } = useRealtimeUpdates({
    projectId,
    user: currentUser ? {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role === 'admin' ? 'ADMIN' : 
            currentUser.role === 'manager' ? 'PROJECT_MANAGER' : 
            'TEAM_MEMBER',
      organizationId: 'org1'
    } as ProjectUser : undefined,
  })

  // Merge online users with team members
  const teamMembersWithStatus = mockTeamMembers.map(member => {
    const isOnline = onlineUsers.some(u => u.email === member.email)
    return {
      ...member,
      status: isOnline ? 'online' as const : member.status
    }
  })

  // Generate updates from approvals and tasks
  const updates: Update[] = [
    ...mockApprovals.filter(a => a.status === 'pending').map(approval => ({
      id: `U-${approval.id}`,
      type: 'approval_request' as const,
      title: `Approval Required: ${approval.taskName}`,
      description: approval.description,
      timestamp: approval.requestedAt,
      read: false,
      relatedApproval: approval,
      author: approval.requestedBy
    })),
    {
      id: 'U1',
      type: 'mention',
      title: 'You were mentioned in Database Schema Design',
      description: '@john.doe Can you review the normalized schema?',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      author: mockTeamMembers[1]
    },
    {
      id: 'U2',
      type: 'task_update',
      title: 'Infrastructure Setup marked as 85% complete',
      description: 'CI/CD pipeline configuration completed',
      timestamp: new Date(Date.now() - 14400000),
      read: true,
      author: mockTeamMembers[2]
    }
  ]

  const handleApproval = (approvalId: string, approved: boolean) => {
    toast.success(approved ? 'Request approved' : 'Request rejected')
    // In a real app, update the approval status via API
  }

  const handleComment = () => {
    if (!newComment.trim()) return
    
    toast.success('Comment added')
    setNewComment('')
    // In a real app, add comment via API
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'away': return 'bg-yellow-500'
      case 'offline': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  const getApprovalTypeIcon = (type: string) => {
    switch (type) {
      case 'timeline_extension': return <Clock className="w-4 h-4" />
      case 'budget_increase': return <AlertCircle className="w-4 h-4" />
      case 'task_completion': return <CheckCircle className="w-4 h-4" />
      case 'scope_change': return <Flag className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Team Collaboration</h2>
          <div className="flex items-center gap-2 text-sm">
            {onlineUsers.length > 0 ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-neutral-600">
                  {onlineUsers.length} team member{onlineUsers.length !== 1 ? 's' : ''} online
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-500">No one online</span>
              </>
            )}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-6">
          {[
            { id: 'team', label: 'Team Members', count: mockTeamMembers.length },
            { id: 'approvals', label: 'Approvals', count: mockApprovals.filter(a => a.status === 'pending').length },
            { id: 'updates', label: 'Updates', count: updates.filter(u => !u.read).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 border-b-2 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white' 
                    : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembersWithStatus.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}>
                          {member.status === 'online' && (
                            <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-neutral-600">{member.email}</div>
                        {member.status === 'offline' && member.lastSeen && (
                          <div className="text-xs text-neutral-500">
                            Last seen {formatDistanceToNow(member.lastSeen, { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-neutral-100 text-neutral-700'
                      }`}>
                        {member.role}
                      </span>
                      <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Approvals Tab */}
          {activeTab === 'approvals' && (
            <motion.div
              key="approvals"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm rounded-lg bg-primary text-white">
                    All
                  </button>
                  <button className="px-3 py-1 text-sm rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                    Pending ({mockApprovals.filter(a => a.status === 'pending').length})
                  </button>
                  <button className="px-3 py-1 text-sm rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200">
                    Approved ({mockApprovals.filter(a => a.status === 'approved').length})
                  </button>
                </div>
                <button 
                  onClick={() => setShowNewApproval(true)}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  New Request
                </button>
              </div>

              <div className="space-y-4">
                {mockApprovals.map((approval) => (
                  <div 
                    key={approval.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedApproval?.id === approval.id 
                        ? 'border-primary bg-primary-50' 
                        : 'hover:border-neutral-300'
                    }`}
                    onClick={() => setSelectedApproval(approval)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          approval.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {getApprovalTypeIcon(approval.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{approval.taskName}</h4>
                          <p className="text-sm text-neutral-600 mt-1">{approval.description}</p>
                          {approval.currentValue && (
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <span className="text-neutral-500">Current:</span>
                              <span className="font-medium">{approval.currentValue}</span>
                              <span className="text-neutral-500">→</span>
                              <span className="font-medium text-primary">{approval.requestedValue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        approval.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {approval.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-neutral-600">
                        <span>By {approval.requestedBy.name}</span>
                        <span>{formatDistanceToNow(approval.requestedAt, { addSuffix: true })}</span>
                        {approval.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {approval.comments.length}
                          </span>
                        )}
                      </div>
                      {approval.status === 'pending' && (
                        <PermissionGate 
                          resource="approvals" 
                          action="approve"
                          scope={approval.type === 'task_completion' ? 'team' : 'all'}
                          fallback={
                            <div className="text-sm text-neutral-500 flex items-center gap-1">
                              <Lock className="w-4 h-4" />
                              <span>Approval requires higher permissions</span>
                            </div>
                          }
                        >
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproval(approval.id, true)
                              }}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApproval(approval.id, false)
                              }}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </PermissionGate>
                      )}
                    </div>

                    {/* Comments Section */}
                    {selectedApproval?.id === approval.id && approval.comments.length > 0 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {approval.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium">
                                {comment.author.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.author.name}</span>
                                <span className="text-xs text-neutral-500">
                                  {formatDistanceToNow(comment.timestamp, { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-700">{comment.content}</p>
                              {comment.reactions && comment.reactions.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {comment.reactions.map((reaction, index) => (
                                    <button
                                      key={index}
                                      className="flex items-center gap-1 px-2 py-1 bg-neutral-100 rounded-full text-xs hover:bg-neutral-200 transition-colors"
                                    >
                                      <span>{reaction.type}</span>
                                      <span>{reaction.users.length}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Add Comment */}
                        <div className="flex gap-2 mt-3">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                          />
                          <button
                            onClick={handleComment}
                            className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <motion.div
              key="updates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-3">
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
                      update.read 
                        ? 'bg-white hover:bg-neutral-50' 
                        : 'bg-primary-50 border-primary-200'
                    }`}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      update.type === 'approval_request' ? 'bg-yellow-100 text-yellow-700' :
                      update.type === 'mention' ? 'bg-blue-100 text-blue-700' :
                      update.type === 'task_update' ? 'bg-green-100 text-green-700' :
                      'bg-neutral-100 text-neutral-700'
                    }`}>
                      {update.type === 'approval_request' ? <AlertCircle className="w-4 h-4" /> :
                       update.type === 'mention' ? <AtSign className="w-4 h-4" /> :
                       update.type === 'task_update' ? <CheckCircle className="w-4 h-4" /> :
                       <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{update.title}</h4>
                      <p className="text-sm text-neutral-600 mt-1">{update.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span>By {update.author.name}</span>
                        <span>{formatDistanceToNow(update.timestamp, { addSuffix: true })}</span>
                      </div>
                    </div>
                    {!update.read && (
                      <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                        <Eye className="w-4 h-4 text-neutral-500" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}