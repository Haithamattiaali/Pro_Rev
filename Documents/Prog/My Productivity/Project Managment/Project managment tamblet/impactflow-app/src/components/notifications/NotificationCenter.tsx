'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, ExternalLink, Clock, MessageCircle, CheckCircle, AlertTriangle, Inbox } from 'lucide-react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import type { Notification } from '@/server/socket'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NotificationCenterProps {
  projectId?: string
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function NotificationCenter({ projectId, user }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { notifications, clearNotifications, markNotificationRead } = useRealtimeUpdates({
    projectId,
    user: user as any,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case 'approval':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-500" />
      case 'system':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markNotificationRead(notification.id)
    if (notification.actionUrl) {
      setIsOpen(false)
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      clearNotifications()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.notification-center')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="notification-center relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {format(new Date(notification.timestamp), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </Link>
                        )}
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    notifications.forEach(n => {
                      if (!n.read) {
                        markNotificationRead(n.id)
                      }
                    })
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/inbox')
                }}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
              >
                <Inbox className="w-4 h-4" />
                View all in Inbox
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}