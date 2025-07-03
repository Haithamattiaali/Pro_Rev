'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Square,
  Mail,
  MailOpen,
  Archive,
  Trash2,
  MoreVertical,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Calendar,
  Users,
  FileText,
  ExternalLink
} from 'lucide-react';
import { 
  EmailNotification, 
  NotificationType, 
  NotificationStatus,
  NotificationPriority 
} from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: EmailNotification;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onMarkAsRead: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function NotificationItem({
  notification,
  isSelected,
  onToggleSelect,
  onClick,
  onMarkAsRead,
  onArchive,
  onDelete,
}: NotificationItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isUnread = notification.status === NotificationStatus.UNREAD;
  const icon = getNotificationIcon(notification.type);
  const priorityColor = getPriorityColor(notification.priority);

  const handleAction = async (
    e: React.MouseEvent,
    action: () => Promise<void>
  ) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
      setShowActions(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`
        relative group border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer
        ${isUnread ? 'bg-blue-50 hover:bg-blue-50/70' : ''}
        ${isSelected ? 'bg-blue-100 hover:bg-blue-100' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-4 px-6 py-4">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="mt-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-blue-600" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

        {/* Icon */}
        <div className={`p-2 rounded-lg ${isUnread ? 'bg-white' : 'bg-gray-100'}`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-sm ${isUnread ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                  {notification.title}
                </h4>
                {notification.priority === NotificationPriority.URGENT && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                    Urgent
                  </span>
                )}
                {notification.priority === NotificationPriority.HIGH && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                    High
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {notification.message}
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {notification.metadata.fromUserName && (
                  <span className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center">
                      {notification.metadata.fromUserAvatar ? (
                        <img
                          src={notification.metadata.fromUserAvatar}
                          alt=""
                          className="w-full h-full rounded-full"
                        />
                      ) : (
                        <span className="text-[10px] font-medium text-gray-600">
                          {notification.metadata.fromUserName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {notification.metadata.fromUserName}
                  </span>
                )}
                
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
                
                {notification.metadata.actionLabel && (
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    {notification.metadata.actionLabel}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Priority indicator */}
            <div className={`w-2 h-2 rounded-full ${priorityColor} flex-shrink-0 mt-2`} />
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={isProcessing}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
            >
              {isUnread && (
                <button
                  onClick={(e) => handleAction(e, onMarkAsRead)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  disabled={isProcessing}
                >
                  <MailOpen className="w-4 h-4" />
                  Mark as read
                </button>
              )}
              
              <button
                onClick={(e) => handleAction(e, onArchive)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                disabled={isProcessing}
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              
              <button
                onClick={(e) => handleAction(e, onDelete)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          )}
        </div>

        {/* Unread indicator */}
        {isUnread && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
        )}
      </div>
    </motion.div>
  );
}

// Helper functions
function getNotificationIcon(type: NotificationType) {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
      return <CheckSquare className={`${iconClass} text-blue-600`} />;
    case NotificationType.TASK_COMPLETED:
      return <CheckCircle className={`${iconClass} text-green-600`} />;
    case NotificationType.APPROVAL_REQUESTED:
      return <FileText className={`${iconClass} text-orange-600`} />;
    case NotificationType.APPROVAL_DECISION:
      return <FileText className={`${iconClass} text-purple-600`} />;
    case NotificationType.COMMENT_MENTION:
      return <MessageSquare className={`${iconClass} text-blue-600`} />;
    case NotificationType.DEADLINE_APPROACHING:
      return <Calendar className={`${iconClass} text-yellow-600`} />;
    case NotificationType.TASK_OVERDUE:
      return <AlertCircle className={`${iconClass} text-red-600`} />;
    case NotificationType.PROJECT_UPDATE:
      return <FileText className={`${iconClass} text-gray-600`} />;
    case NotificationType.TEAM_ANNOUNCEMENT:
      return <Users className={`${iconClass} text-indigo-600`} />;
    default:
      return <Mail className={`${iconClass} text-gray-600`} />;
  }
}

function getPriorityColor(priority: NotificationPriority): string {
  switch (priority) {
    case NotificationPriority.URGENT:
      return 'bg-red-500';
    case NotificationPriority.HIGH:
      return 'bg-orange-500';
    case NotificationPriority.MEDIUM:
      return 'bg-yellow-500';
    case NotificationPriority.LOW:
      return 'bg-green-500';
    default:
      return 'bg-gray-400';
  }
}