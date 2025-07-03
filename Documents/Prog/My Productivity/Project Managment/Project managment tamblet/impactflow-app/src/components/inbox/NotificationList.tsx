'use client';

import { EmailNotification } from '@/types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationListProps {
  notifications: EmailNotification[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onNotificationClick: (notification: EmailNotification) => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotificationList({
  notifications,
  selectedIds,
  onToggleSelect,
  onNotificationClick,
  onMarkAsRead,
  onArchive,
  onDelete,
}: NotificationListProps) {
  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt);
    const dateKey = getDateKey(date);
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(notification);
    return groups;
  }, {} as Record<string, EmailNotification[]>);

  // Sort date keys (newest first)
  const sortedDateKeys = Object.keys(groupedNotifications).sort((a, b) => {
    const dateA = new Date(groupedNotifications[a][0].createdAt);
    const dateB = new Date(groupedNotifications[b][0].createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="divide-y divide-gray-200">
      {sortedDateKeys.map((dateKey) => (
        <div key={dateKey}>
          <div className="sticky top-0 bg-gray-50 px-6 py-2 text-sm font-medium text-gray-600 border-b border-gray-200">
            {formatDateHeader(dateKey)}
          </div>
          
          <div className="bg-white">
            {groupedNotifications[dateKey].map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isSelected={selectedIds.has(notification.id)}
                onToggleSelect={() => onToggleSelect(notification.id)}
                onClick={() => onNotificationClick(notification)}
                onMarkAsRead={() => onMarkAsRead(notification.id)}
                onArchive={() => onArchive(notification.id)}
                onDelete={() => onDelete(notification.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function getDateKey(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'today';
  } else if (isSameDay(date, yesterday)) {
    return 'yesterday';
  } else if (isWithinLastWeek(date)) {
    return 'this-week';
  } else if (isWithinLastMonth(date)) {
    return 'this-month';
  } else {
    return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
}

function formatDateHeader(dateKey: string): string {
  if (dateKey === 'today') return 'Today';
  if (dateKey === 'yesterday') return 'Yesterday';
  if (dateKey === 'this-week') return 'Earlier this week';
  if (dateKey === 'this-month') return 'Earlier this month';
  
  const [year, month] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isWithinLastWeek(date: Date): boolean {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo && date <= today;
}

function isWithinLastMonth(date: Date): boolean {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return date >= monthAgo && date <= today;
}