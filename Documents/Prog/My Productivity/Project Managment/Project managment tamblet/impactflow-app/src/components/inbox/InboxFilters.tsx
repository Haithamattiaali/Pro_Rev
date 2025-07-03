'use client';

import { useState } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { 
  NotificationFilter, 
  NotificationType, 
  NotificationStatus,
  NotificationPriority,
  NotificationStats
} from '@/types/notification';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface InboxFiltersProps {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  stats: NotificationStats | null;
}

export function InboxFilters({ filter, onFilterChange, stats }: InboxFiltersProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const handleTypeChange = (type: NotificationType) => {
    const types = filter.types || [];
    const newTypes = types.includes(type)
      ? types.filter(t => t !== type)
      : [...types, type];
    
    onFilterChange({
      ...filter,
      types: newTypes.length > 0 ? newTypes : undefined,
    });
  };

  const handleStatusChange = (status: NotificationStatus) => {
    onFilterChange({
      ...filter,
      status: filter.status === status ? undefined : status,
    });
  };

  const handlePriorityChange = (priority: NotificationPriority) => {
    onFilterChange({
      ...filter,
      priority: filter.priority === priority ? undefined : priority,
    });
  };

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'custom') => {
    setDateRange(range);
    
    let start: Date;
    let end: Date = endOfDay(new Date());
    
    switch (range) {
      case 'today':
        start = startOfDay(new Date());
        break;
      case 'week':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case 'month':
        start = startOfDay(subDays(new Date(), 30));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = startOfDay(new Date(customStartDate));
          end = endOfDay(new Date(customEndDate));
        } else {
          return;
        }
        break;
    }
    
    onFilterChange({
      ...filter,
      dateRange: { start, end },
    });
  };

  const clearFilters = () => {
    onFilterChange({});
    setDateRange('week');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const activeFiltersCount = [
    filter.types?.length || 0,
    filter.status ? 1 : 0,
    filter.priority ? 1 : 0,
    filter.dateRange ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-3">
        {/* Status Filter */}
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter.status === NotificationStatus.UNREAD}
              onClick={() => handleStatusChange(NotificationStatus.UNREAD)}
              count={stats?.unreadCount}
            >
              Unread
            </FilterButton>
            <FilterButton
              active={filter.status === NotificationStatus.READ}
              onClick={() => handleStatusChange(NotificationStatus.READ)}
            >
              Read
            </FilterButton>
            <FilterButton
              active={filter.status === NotificationStatus.ARCHIVED}
              onClick={() => handleStatusChange(NotificationStatus.ARCHIVED)}
            >
              Archived
            </FilterButton>
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 block">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter.types?.includes(NotificationType.TASK_ASSIGNED)}
              onClick={() => handleTypeChange(NotificationType.TASK_ASSIGNED)}
              count={stats?.byType[NotificationType.TASK_ASSIGNED]}
            >
              Task Assigned
            </FilterButton>
            <FilterButton
              active={filter.types?.includes(NotificationType.TASK_COMPLETED)}
              onClick={() => handleTypeChange(NotificationType.TASK_COMPLETED)}
              count={stats?.byType[NotificationType.TASK_COMPLETED]}
            >
              Task Completed
            </FilterButton>
            <FilterButton
              active={filter.types?.includes(NotificationType.APPROVAL_REQUESTED)}
              onClick={() => handleTypeChange(NotificationType.APPROVAL_REQUESTED)}
              count={stats?.byType[NotificationType.APPROVAL_REQUESTED]}
            >
              Approval Requested
            </FilterButton>
            <FilterButton
              active={filter.types?.includes(NotificationType.COMMENT_MENTION)}
              onClick={() => handleTypeChange(NotificationType.COMMENT_MENTION)}
              count={stats?.byType[NotificationType.COMMENT_MENTION]}
            >
              Mentions
            </FilterButton>
            <FilterButton
              active={filter.types?.includes(NotificationType.DEADLINE_APPROACHING)}
              onClick={() => handleTypeChange(NotificationType.DEADLINE_APPROACHING)}
              count={stats?.byType[NotificationType.DEADLINE_APPROACHING]}
            >
              Deadlines
            </FilterButton>
            <FilterButton
              active={filter.types?.includes(NotificationType.TASK_OVERDUE)}
              onClick={() => handleTypeChange(NotificationType.TASK_OVERDUE)}
              count={stats?.byType[NotificationType.TASK_OVERDUE]}
            >
              Overdue
            </FilterButton>
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 block">
            Priority
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={filter.priority === NotificationPriority.URGENT}
              onClick={() => handlePriorityChange(NotificationPriority.URGENT)}
              count={stats?.byPriority[NotificationPriority.URGENT]}
              color="red"
            >
              Urgent
            </FilterButton>
            <FilterButton
              active={filter.priority === NotificationPriority.HIGH}
              onClick={() => handlePriorityChange(NotificationPriority.HIGH)}
              count={stats?.byPriority[NotificationPriority.HIGH]}
              color="orange"
            >
              High
            </FilterButton>
            <FilterButton
              active={filter.priority === NotificationPriority.MEDIUM}
              onClick={() => handlePriorityChange(NotificationPriority.MEDIUM)}
              count={stats?.byPriority[NotificationPriority.MEDIUM]}
              color="yellow"
            >
              Medium
            </FilterButton>
            <FilterButton
              active={filter.priority === NotificationPriority.LOW}
              onClick={() => handlePriorityChange(NotificationPriority.LOW)}
              count={stats?.byPriority[NotificationPriority.LOW]}
              color="green"
            >
              Low
            </FilterButton>
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2 block">
            Date Range
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton
              active={dateRange === 'today'}
              onClick={() => handleDateRangeChange('today')}
              icon={<Calendar className="w-3 h-3" />}
            >
              Today
            </FilterButton>
            <FilterButton
              active={dateRange === 'week'}
              onClick={() => handleDateRangeChange('week')}
              icon={<Calendar className="w-3 h-3" />}
            >
              Last 7 days
            </FilterButton>
            <FilterButton
              active={dateRange === 'month'}
              onClick={() => handleDateRangeChange('month')}
              icon={<Calendar className="w-3 h-3" />}
            >
              Last 30 days
            </FilterButton>
            <FilterButton
              active={dateRange === 'custom'}
              onClick={() => setDateRange('custom')}
              icon={<Calendar className="w-3 h-3" />}
            >
              Custom
            </FilterButton>
          </div>
          
          {dateRange === 'custom' && (
            <div className="flex gap-2 mt-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500 self-center">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleDateRangeChange('custom')}
                disabled={!customStartDate || !customEndDate}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count?: number;
  color?: 'blue' | 'red' | 'orange' | 'yellow' | 'green';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, count, color = 'blue', icon, children }: FilterButtonProps) {
  const colors = {
    blue: {
      active: 'bg-blue-100 text-blue-700 border-blue-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    red: {
      active: 'bg-red-100 text-red-700 border-red-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    orange: {
      active: 'bg-orange-100 text-orange-700 border-orange-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    yellow: {
      active: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    green: {
      active: 'bg-green-100 text-green-700 border-green-300',
      inactive: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
    },
  };

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 text-sm font-medium border rounded-lg transition-colors
        ${active ? colors[color].active : colors[color].inactive}
        flex items-center gap-1.5
      `}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-1 px-1.5 py-0.5 text-xs rounded-full
          ${active ? 'bg-white/50' : 'bg-gray-100'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}