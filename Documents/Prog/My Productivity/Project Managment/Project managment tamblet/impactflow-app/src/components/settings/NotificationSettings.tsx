'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Clock,
  Moon,
  Save,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  NotificationPreferences,
  NotificationType,
  DigestFrequency
} from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

export function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const prefs = await notificationService.getUserPreferences(user.id);
        setPreferences(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences
  const handleSave = async () => {
    if (!user || !preferences) return;

    try {
      setIsSaving(true);
      await notificationService.updateUserPreferences(user.id, preferences);
      setHasChanges(false);
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Update preference and mark as changed
  const updatePreference = (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    
    setPreferences({ ...preferences, ...updates });
    setHasChanges(true);
  };

  // Toggle notification type
  const toggleNotificationType = (type: NotificationType) => {
    if (!preferences) return;
    
    updatePreference({
      notificationTypes: {
        ...preferences.notificationTypes,
        [type]: !preferences.notificationTypes[type],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load notification preferences
      </div>
    );
  }

  const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
    [NotificationType.TASK_ASSIGNED]: {
      label: 'Task Assignments',
      description: 'When someone assigns you a new task',
    },
    [NotificationType.TASK_COMPLETED]: {
      label: 'Task Completions',
      description: 'When tasks you\'re involved with are completed',
    },
    [NotificationType.APPROVAL_REQUESTED]: {
      label: 'Approval Requests',
      description: 'When your approval is needed for updates',
    },
    [NotificationType.APPROVAL_DECISION]: {
      label: 'Approval Decisions',
      description: 'When your updates are approved or rejected',
    },
    [NotificationType.COMMENT_MENTION]: {
      label: 'Mentions',
      description: 'When someone mentions you in a comment',
    },
    [NotificationType.DEADLINE_APPROACHING]: {
      label: 'Deadline Reminders',
      description: 'Reminders for upcoming task deadlines',
    },
    [NotificationType.TASK_OVERDUE]: {
      label: 'Overdue Tasks',
      description: 'Notifications when tasks become overdue',
    },
    [NotificationType.PROJECT_UPDATE]: {
      label: 'Project Updates',
      description: 'Important updates about your projects',
    },
    [NotificationType.TEAM_ANNOUNCEMENT]: {
      label: 'Team Announcements',
      description: 'Announcements from team leads and managers',
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
            </div>
            
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Master Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Notification Channels</h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">In-App Notifications</div>
                    <div className="text-sm text-gray-500">Show notifications in the app inbox</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.inAppEnabled}
                  onChange={(e) => updatePreference({ inAppEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Send notifications to your email</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled}
                  onChange={(e) => updatePreference({ emailEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Email Digest */}
          {preferences.emailEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Email Frequency
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.values(DigestFrequency).map((frequency) => (
                  <label
                    key={frequency}
                    className={`
                      relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-colors
                      ${preferences.digestFrequency === frequency
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="digestFrequency"
                      value={frequency}
                      checked={preferences.digestFrequency === frequency}
                      onChange={() => updatePreference({ digestFrequency: frequency })}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">
                      {frequency.charAt(0) + frequency.slice(1).toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-800">
                  {preferences.digestFrequency === DigestFrequency.IMMEDIATE && 
                    'You\'ll receive emails as soon as notifications are triggered.'}
                  {preferences.digestFrequency === DigestFrequency.HOURLY && 
                    'You\'ll receive a summary email every hour with all notifications.'}
                  {preferences.digestFrequency === DigestFrequency.DAILY && 
                    'You\'ll receive a daily summary email at 9 AM with all notifications.'}
                  {preferences.digestFrequency === DigestFrequency.WEEKLY && 
                    'You\'ll receive a weekly summary email on Mondays at 9 AM.'}
                  {preferences.digestFrequency === DigestFrequency.NEVER && 
                    'Email notifications are paused. You can still view notifications in the app.'}
                </p>
              </div>
            </motion.div>
          )}

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
            
            <div className="space-y-2">
              {Object.entries(notificationTypeLabels).map(([type, { label, description }]) => (
                <label
                  key={type}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500">{description}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationTypes[type as NotificationType]}
                    onChange={() => toggleNotificationType(type as NotificationType)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Moon className="w-5 h-5 text-gray-600" />
              Quiet Hours
            </h3>
            
            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div>
                <div className="font-medium text-gray-900">Enable Quiet Hours</div>
                <div className="text-sm text-gray-500">Pause notifications during specified hours</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.quietHours?.enabled || false}
                onChange={(e) => updatePreference({
                  quietHours: {
                    ...preferences.quietHours,
                    enabled: e.target.checked,
                    startTime: preferences.quietHours?.startTime || '22:00',
                    endTime: preferences.quietHours?.endTime || '08:00',
                    timezone: preferences.quietHours?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                  },
                })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            
            {preferences.quietHours?.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4 pl-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.startTime}
                    onChange={(e) => updatePreference({
                      quietHours: {
                        ...preferences.quietHours!,
                        startTime: e.target.value,
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={preferences.quietHours.endTime}
                    onChange={(e) => updatePreference({
                      quietHours: {
                        ...preferences.quietHours!,
                        endTime: e.target.value,
                      },
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Save Reminder */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-700">You have unsaved changes</span>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}