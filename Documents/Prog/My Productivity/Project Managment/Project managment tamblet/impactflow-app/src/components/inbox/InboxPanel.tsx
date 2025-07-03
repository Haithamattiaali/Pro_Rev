'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Inbox, 
  Filter, 
  Search, 
  CheckCheck, 
  Archive, 
  Trash2, 
  Bell,
  BellOff,
  RefreshCw,
  Settings
} from 'lucide-react';
import { NotificationList } from './NotificationList';
import { InboxFilters } from './InboxFilters';
import { notificationService } from '@/services/notificationService';
import { 
  EmailNotification, 
  NotificationFilter, 
  NotificationStats,
  NotificationStatus 
} from '@/types/notification';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function InboxPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [notifs, notifStats] = await Promise.all([
        notificationService.getUserNotifications(user.id, {
          ...filter,
          search: searchQuery || undefined,
        }),
        notificationService.getUserNotificationStats(user.id),
      ]);
      
      setNotifications(notifs);
      setStats(notifStats);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user, filter, searchQuery]);

  // Load notifications on mount and when filters change
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
    toast.success('Inbox refreshed');
  };

  // Mark selected as read
  const handleMarkAsRead = async () => {
    if (!user || selectedIds.size === 0) return;

    try {
      await notificationService.bulkUpdateStatus(
        Array.from(selectedIds),
        user.id,
        NotificationStatus.READ
      );
      setSelectedIds(new Set());
      await loadNotifications();
      toast.success(`Marked ${selectedIds.size} notifications as read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      await notificationService.markAllAsRead(user.id);
      await loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Archive selected
  const handleArchive = async () => {
    if (!user || selectedIds.size === 0) return;

    try {
      await notificationService.bulkUpdateStatus(
        Array.from(selectedIds),
        user.id,
        NotificationStatus.ARCHIVED
      );
      setSelectedIds(new Set());
      await loadNotifications();
      toast.success(`Archived ${selectedIds.size} notifications`);
    } catch (error) {
      console.error('Failed to archive:', error);
      toast.error('Failed to archive notifications');
    }
  };

  // Delete selected
  const handleDelete = async () => {
    if (!user || selectedIds.size === 0) return;

    try {
      await notificationService.bulkUpdateStatus(
        Array.from(selectedIds),
        user.id,
        NotificationStatus.DELETED
      );
      setSelectedIds(new Set());
      await loadNotifications();
      toast.success(`Deleted ${selectedIds.size} notifications`);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete notifications');
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    }
  };

  // Handle notification action
  const handleNotificationAction = async (notification: EmailNotification) => {
    if (!user) return;

    // Mark as read if unread
    if (notification.status === NotificationStatus.UNREAD) {
      await notificationService.markAsRead(notification.id, user.id);
      await loadNotifications();
    }

    // Navigate to action URL if available
    if (notification.metadata.actionUrl) {
      window.location.href = notification.metadata.actionUrl;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Inbox className="w-6 h-6 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Inbox</h2>
            {stats && stats.unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {stats.unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => window.location.href = '/settings/notifications'}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <InboxFilters
              filter={filter}
              onFilterChange={setFilter}
              stats={stats}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedIds.size === notifications.length ? 'Deselect all' : 'Select all'}
              </button>
              <span className="text-sm text-gray-600">
                {selectedIds.size} selected
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAsRead}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark as read
              </button>
              
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            {filter.status === NotificationStatus.ARCHIVED ? (
              <>
                <Archive className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-lg font-medium">No archived notifications</p>
                <p className="text-sm">Archived notifications will appear here</p>
              </>
            ) : searchQuery ? (
              <>
                <Search className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try a different search term</p>
              </>
            ) : (
              <>
                {stats?.unreadCount === 0 ? (
                  <>
                    <BellOff className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-lg font-medium">All caught up!</p>
                    <p className="text-sm">You have no new notifications</p>
                  </>
                ) : (
                  <>
                    <Bell className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">Notifications will appear here</p>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <NotificationList
            notifications={notifications}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onNotificationClick={handleNotificationAction}
            onMarkAsRead={async (id) => {
              if (user) {
                await notificationService.markAsRead(id, user.id);
                await loadNotifications();
              }
            }}
            onArchive={async (id) => {
              if (user) {
                await notificationService.archiveNotification(id, user.id);
                await loadNotifications();
                toast.success('Notification archived');
              }
            }}
            onDelete={async (id) => {
              if (user) {
                await notificationService.deleteNotification(id, user.id);
                await loadNotifications();
                toast.success('Notification deleted');
              }
            }}
          />
        )}
      </div>

      {/* Quick Actions */}
      {stats && stats.unreadCount > 0 && notifications.length > 0 && (
        <div className="bg-white border-t border-gray-200 px-6 py-3">
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}