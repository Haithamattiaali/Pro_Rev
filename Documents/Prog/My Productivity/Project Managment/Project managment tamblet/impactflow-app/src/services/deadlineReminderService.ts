import { notificationService } from './notificationService';

class DeadlineReminderService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: Date | null = null;
  private readonly CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
  private readonly REMINDER_THRESHOLDS = [7, 3, 1]; // Days before deadline

  constructor() {
    // Start the reminder service
    this.start();
  }

  // Start the reminder service
  start(): void {
    if (this.checkInterval) return;

    // Run initial check
    this.checkDeadlines();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkDeadlines();
    }, this.CHECK_INTERVAL_MS);

    console.log('Deadline reminder service started');
  }

  // Stop the reminder service
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Deadline reminder service stopped');
  }

  // Check for approaching deadlines
  private async checkDeadlines(): Promise<void> {
    try {
      const now = new Date();
      
      // Skip if we've already checked recently (within last 30 minutes)
      if (this.lastCheckTime) {
        const timeSinceLastCheck = now.getTime() - this.lastCheckTime.getTime();
        if (timeSinceLastCheck < 30 * 60 * 1000) {
          return;
        }
      }

      console.log('Checking for approaching deadlines...');
      
      // Check for approaching deadlines and overdue tasks
      await notificationService.checkAndNotifyDeadlines();
      
      this.lastCheckTime = now;
      console.log('Deadline check completed');
    } catch (error) {
      console.error('Error checking deadlines:', error);
    }
  }

  // Force a deadline check (useful for testing or manual triggers)
  async forceCheck(): Promise<void> {
    console.log('Forcing deadline check...');
    this.lastCheckTime = null; // Reset last check time
    await this.checkDeadlines();
  }

  // Get service status
  getStatus(): {
    isRunning: boolean;
    lastCheckTime: Date | null;
    nextCheckTime: Date | null;
  } {
    const isRunning = this.checkInterval !== null;
    const nextCheckTime = this.lastCheckTime
      ? new Date(this.lastCheckTime.getTime() + this.CHECK_INTERVAL_MS)
      : null;

    return {
      isRunning,
      lastCheckTime: this.lastCheckTime,
      nextCheckTime,
    };
  }

  // Schedule a one-time reminder for a specific task
  async scheduleTaskReminder(
    taskId: string,
    reminderDate: Date,
    metadata?: Record<string, any>
  ): Promise<void> {
    const now = new Date();
    const delay = reminderDate.getTime() - now.getTime();

    if (delay <= 0) {
      // Reminder date has already passed
      console.warn(`Reminder date has already passed for task ${taskId}`);
      return;
    }

    // Schedule the reminder
    setTimeout(async () => {
      try {
        // This would integrate with the notification service
        // to send a specific reminder for this task
        console.log(`Sending scheduled reminder for task ${taskId}`);
      } catch (error) {
        console.error(`Failed to send reminder for task ${taskId}:`, error);
      }
    }, delay);
  }

  // Batch schedule reminders for multiple tasks
  async batchScheduleReminders(
    tasks: Array<{
      taskId: string;
      reminderDate: Date;
      metadata?: Record<string, any>;
    }>
  ): Promise<void> {
    for (const task of tasks) {
      await this.scheduleTaskReminder(task.taskId, task.reminderDate, task.metadata);
    }
  }

  // Get upcoming reminders (mock implementation)
  getUpcomingReminders(): Array<{
    taskId: string;
    scheduledFor: Date;
    type: 'deadline' | 'custom';
  }> {
    // In a real implementation, this would query a database
    // or maintain an in-memory list of scheduled reminders
    return [];
  }

  // Cancel a scheduled reminder
  cancelReminder(taskId: string): void {
    // In a real implementation, this would cancel the scheduled reminder
    console.log(`Cancelling reminder for task ${taskId}`);
  }

  // Update reminder preferences for a task
  updateTaskReminderPreferences(
    taskId: string,
    preferences: {
      enableReminders: boolean;
      customReminderDays?: number[];
      reminderTime?: string; // HH:mm format
    }
  ): void {
    // In a real implementation, this would update the task's reminder preferences
    console.log(`Updating reminder preferences for task ${taskId}:`, preferences);
  }
}

// Export singleton instance
export const deadlineReminderService = new DeadlineReminderService();

// Export types
export type { DeadlineReminderService };