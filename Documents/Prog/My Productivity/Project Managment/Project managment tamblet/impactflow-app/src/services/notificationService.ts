import { 
  EmailNotification, 
  NotificationType, 
  NotificationStatus, 
  NotificationPriority,
  NotificationPreferences,
  NotificationFilter,
  NotificationStats,
  DigestFrequency
} from '@/types/notification';
import { User } from '@/types/auth';
import { Task } from '@/types/project';
import { emailService } from './emailService';

class NotificationService {
  private notifications: Map<string, EmailNotification> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private mentionRegex = /@(\w+)/g;

  // Create a new notification
  async createNotification(
    userId: string,
    type: NotificationType,
    metadata: EmailNotification['metadata'],
    priority?: NotificationPriority
  ): Promise<EmailNotification> {
    const notification: EmailNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title: this.generateTitle(type, metadata),
      message: this.generateMessage(type, metadata),
      metadata,
      status: NotificationStatus.UNREAD,
      priority: priority || this.getDefaultPriority(type),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Store notification
    this.notifications.set(notification.id, notification);

    // Get user preferences and email
    const preferences = this.userPreferences.get(userId);
    const userEmail = await this.getUserEmail(userId);

    // Queue email if enabled
    if (userEmail && preferences?.emailEnabled !== false) {
      await emailService.queueEmail(userEmail, notification, preferences);
    }

    // Emit real-time notification event
    this.emitNotificationEvent(notification);

    return notification;
  }

  // Create notifications for task assignment
  async notifyTaskAssignment(task: Task, assignedBy: User): Promise<void> {
    if (!task.assigneeId || task.assigneeId === assignedBy.id) return;

    await this.createNotification(
      task.assigneeId,
      NotificationType.TASK_ASSIGNED,
      {
        taskId: task.id,
        taskName: task.name,
        projectId: task.projectId,
        fromUserId: assignedBy.id,
        fromUserName: assignedBy.name,
        fromUserAvatar: assignedBy.avatar,
        dueDate: task.endDate,
        actionUrl: `/projects/${task.projectId}?task=${task.id}`,
        actionLabel: 'View Task',
      }
    );
  }

  // Create notifications for task completion
  async notifyTaskCompletion(task: Task, completedBy: User): Promise<void> {
    // Notify project managers and stakeholders
    const stakeholders = await this.getProjectStakeholders(task.projectId);
    
    const notifications = stakeholders
      .filter(user => user.id !== completedBy.id)
      .map(user => ({
        userId: user.id,
        type: NotificationType.TASK_COMPLETED,
        metadata: {
          taskId: task.id,
          taskName: task.name,
          projectId: task.projectId,
          fromUserId: completedBy.id,
          fromUserName: completedBy.name,
          fromUserAvatar: completedBy.avatar,
          actionUrl: `/projects/${task.projectId}?task=${task.id}`,
          actionLabel: 'View Task',
        },
      }));

    await Promise.all(
      notifications.map(({ userId, type, metadata }) =>
        this.createNotification(userId, type, metadata)
      )
    );
  }

  // Create notifications for approval requests
  async notifyApprovalRequest(
    updateId: string,
    task: Task,
    requestedBy: User,
    approvers: User[]
  ): Promise<void> {
    const notifications = approvers.map(approver => ({
      userId: approver.id,
      type: NotificationType.APPROVAL_REQUESTED,
      metadata: {
        updateId,
        taskId: task.id,
        taskName: task.name,
        projectId: task.projectId,
        fromUserId: requestedBy.id,
        fromUserName: requestedBy.name,
        fromUserAvatar: requestedBy.avatar,
        actionUrl: `/projects/${task.projectId}?task=${task.id}&approval=${updateId}`,
        actionLabel: 'Review & Approve',
      },
      priority: NotificationPriority.HIGH,
    }));

    await Promise.all(
      notifications.map(({ userId, type, metadata, priority }) =>
        this.createNotification(userId, type, metadata, priority)
      )
    );
  }

  // Create notifications for approval decisions
  async notifyApprovalDecision(
    updateId: string,
    task: Task,
    requesterId: string,
    approvedBy: User,
    approved: boolean,
    comments?: string
  ): Promise<void> {
    await this.createNotification(
      requesterId,
      NotificationType.APPROVAL_DECISION,
      {
        updateId,
        taskId: task.id,
        taskName: task.name,
        projectId: task.projectId,
        fromUserId: approvedBy.id,
        fromUserName: approvedBy.name,
        fromUserAvatar: approvedBy.avatar,
        actionUrl: `/projects/${task.projectId}?task=${task.id}`,
        actionLabel: 'View Update',
        additionalData: {
          approved,
          decision: approved ? 'approved' : 'rejected',
          comments,
        },
      }
    );
  }

  // Parse mentions and create notifications
  async notifyMentions(
    commentText: string,
    commentId: string,
    task: Task,
    mentionedBy: User
  ): Promise<void> {
    const mentions = this.parseMentions(commentText);
    if (mentions.length === 0) return;

    const users = await this.getUsersByUsernames(mentions);
    
    const notifications = users
      .filter(user => user.id !== mentionedBy.id)
      .map(user => ({
        userId: user.id,
        type: NotificationType.COMMENT_MENTION,
        metadata: {
          commentId,
          taskId: task.id,
          taskName: task.name,
          projectId: task.projectId,
          fromUserId: mentionedBy.id,
          fromUserName: mentionedBy.name,
          fromUserAvatar: mentionedBy.avatar,
          actionUrl: `/projects/${task.projectId}?task=${task.id}&comment=${commentId}`,
          actionLabel: 'View Comment',
          additionalData: {
            commentText: this.truncateText(commentText, 100),
            commentPreview: this.truncateText(commentText, 50),
          },
        },
      }));

    await Promise.all(
      notifications.map(({ userId, type, metadata }) =>
        this.createNotification(userId, type, metadata)
      )
    );
  }

  // Create deadline notifications
  async checkAndNotifyDeadlines(): Promise<void> {
    const tasks = await this.getUpcomingDeadlineTasks();
    
    for (const task of tasks) {
      if (!task.assigneeId) continue;

      const daysUntilDue = Math.ceil(
        (task.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      // Notify at 7 days, 3 days, and 1 day before deadline
      if ([7, 3, 1].includes(daysUntilDue)) {
        await this.createNotification(
          task.assigneeId,
          NotificationType.DEADLINE_APPROACHING,
          {
            taskId: task.id,
            taskName: task.name,
            projectId: task.projectId,
            dueDate: task.endDate,
            actionUrl: `/projects/${task.projectId}?task=${task.id}`,
            actionLabel: 'View Task',
            additionalData: {
              timeRemaining: this.formatTimeRemaining(daysUntilDue),
              progress: task.percentComplete,
            },
          },
          daysUntilDue === 1 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM
        );
      }
    }

    // Check for overdue tasks
    const overdueTasks = await this.getOverdueTasks();
    
    for (const task of overdueTasks) {
      if (!task.assigneeId) continue;

      const daysOverdue = Math.ceil(
        (Date.now() - task.endDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Notify only once per day for overdue tasks
      const lastNotified = await this.getLastOverdueNotification(task.id, task.assigneeId);
      if (lastNotified && this.isSameDay(lastNotified, new Date())) continue;

      await this.createNotification(
        task.assigneeId,
        NotificationType.TASK_OVERDUE,
        {
          taskId: task.id,
          taskName: task.name,
          projectId: task.projectId,
          dueDate: task.endDate,
          actionUrl: `/projects/${task.projectId}?task=${task.id}`,
          actionLabel: 'Update Task',
          additionalData: {
            daysOverdue: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
            progress: task.percentComplete,
            assigneeName: await this.getUserName(task.assigneeId),
          },
        },
        NotificationPriority.URGENT
      );
    }
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string,
    filter?: NotificationFilter
  ): Promise<EmailNotification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    // Apply filters
    if (filter) {
      if (filter.types?.length) {
        notifications = notifications.filter(n => filter.types!.includes(n.type));
      }
      
      if (filter.status) {
        notifications = notifications.filter(n => n.status === filter.status);
      }
      
      if (filter.priority) {
        notifications = notifications.filter(n => n.priority === filter.priority);
      }
      
      if (filter.dateRange) {
        notifications = notifications.filter(n => 
          n.createdAt >= filter.dateRange!.start &&
          n.createdAt <= filter.dateRange!.end
        );
      }
      
      if (filter.search) {
        const search = filter.search.toLowerCase();
        notifications = notifications.filter(n =>
          n.title.toLowerCase().includes(search) ||
          n.message.toLowerCase().includes(search)
        );
      }
    }

    // Sort by date (newest first)
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Get notification statistics
  async getUserNotificationStats(userId: string): Promise<NotificationStats> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId);

    const stats: NotificationStats = {
      unreadCount: userNotifications.filter(n => n.status === NotificationStatus.UNREAD).length,
      totalCount: userNotifications.length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    // Count by type
    for (const type of Object.values(NotificationType)) {
      stats.byType[type] = userNotifications.filter(n => n.type === type).length;
    }

    // Count by priority
    for (const priority of Object.values(NotificationPriority)) {
      stats.byPriority[priority] = userNotifications.filter(n => n.priority === priority).length;
    }

    return stats;
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    notification.updatedAt = new Date();
    this.notifications.set(notificationId, notification);
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(n => n.userId === userId && n.status === NotificationStatus.UNREAD);

    for (const notification of userNotifications) {
      notification.status = NotificationStatus.READ;
      notification.readAt = new Date();
      notification.updatedAt = new Date();
      this.notifications.set(notification.id, notification);
    }
  }

  // Archive notification
  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    notification.status = NotificationStatus.ARCHIVED;
    notification.archivedAt = new Date();
    notification.updatedAt = new Date();
    this.notifications.set(notificationId, notification);
  }

  // Delete notification
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found');
    }

    notification.status = NotificationStatus.DELETED;
    notification.updatedAt = new Date();
    this.notifications.set(notificationId, notification);
  }

  // Bulk operations
  async bulkUpdateStatus(
    notificationIds: string[],
    userId: string,
    status: NotificationStatus
  ): Promise<void> {
    for (const id of notificationIds) {
      const notification = this.notifications.get(id);
      if (!notification || notification.userId !== userId) continue;

      notification.status = status;
      notification.updatedAt = new Date();
      
      if (status === NotificationStatus.READ) {
        notification.readAt = new Date();
      } else if (status === NotificationStatus.ARCHIVED) {
        notification.archivedAt = new Date();
      }
      
      this.notifications.set(id, notification);
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let preferences = this.userPreferences.get(userId);
    
    if (!preferences) {
      // Create default preferences
      preferences = this.createDefaultPreferences(userId);
      this.userPreferences.set(userId, preferences);
    }
    
    return preferences;
  }

  // Update user preferences
  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const preferences = await this.getUserPreferences(userId);
    
    Object.assign(preferences, updates, {
      updatedAt: new Date(),
    });
    
    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  // Helper methods
  private generateTitle(type: NotificationType, metadata: any): string {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
        return `New Task: ${metadata.taskName}`;
      case NotificationType.TASK_COMPLETED:
        return `Task Completed: ${metadata.taskName}`;
      case NotificationType.APPROVAL_REQUESTED:
        return `Approval Required: ${metadata.taskName}`;
      case NotificationType.APPROVAL_DECISION:
        return `Update ${metadata.additionalData?.approved ? 'Approved' : 'Rejected'}: ${metadata.taskName}`;
      case NotificationType.COMMENT_MENTION:
        return `${metadata.fromUserName} mentioned you`;
      case NotificationType.DEADLINE_APPROACHING:
        return `Deadline Approaching: ${metadata.taskName}`;
      case NotificationType.TASK_OVERDUE:
        return `Task Overdue: ${metadata.taskName}`;
      case NotificationType.PROJECT_UPDATE:
        return `Project Update: ${metadata.projectName}`;
      case NotificationType.TEAM_ANNOUNCEMENT:
        return metadata.title || 'Team Announcement';
      default:
        return 'New Notification';
    }
  }

  private generateMessage(type: NotificationType, metadata: any): string {
    switch (type) {
      case NotificationType.TASK_ASSIGNED:
        return `${metadata.fromUserName} assigned you the task "${metadata.taskName}"`;
      case NotificationType.TASK_COMPLETED:
        return `${metadata.fromUserName} completed the task "${metadata.taskName}"`;
      case NotificationType.APPROVAL_REQUESTED:
        return `${metadata.fromUserName} requested your approval for "${metadata.taskName}"`;
      case NotificationType.APPROVAL_DECISION:
        return `${metadata.fromUserName} ${metadata.additionalData?.approved ? 'approved' : 'rejected'} your update to "${metadata.taskName}"`;
      case NotificationType.COMMENT_MENTION:
        return metadata.additionalData?.commentPreview || 'You were mentioned in a comment';
      case NotificationType.DEADLINE_APPROACHING:
        return `Task "${metadata.taskName}" is due ${metadata.additionalData?.timeRemaining}`;
      case NotificationType.TASK_OVERDUE:
        return `Task "${metadata.taskName}" is ${metadata.additionalData?.daysOverdue} overdue`;
      case NotificationType.PROJECT_UPDATE:
        return metadata.additionalData?.updateSummary || 'There\'s a new project update';
      case NotificationType.TEAM_ANNOUNCEMENT:
        return metadata.additionalData?.announcementText || 'New team announcement';
      default:
        return 'You have a new notification';
    }
  }

  private getDefaultPriority(type: NotificationType): NotificationPriority {
    switch (type) {
      case NotificationType.TASK_OVERDUE:
      case NotificationType.APPROVAL_REQUESTED:
        return NotificationPriority.HIGH;
      case NotificationType.DEADLINE_APPROACHING:
      case NotificationType.TASK_ASSIGNED:
      case NotificationType.COMMENT_MENTION:
        return NotificationPriority.MEDIUM;
      default:
        return NotificationPriority.LOW;
    }
  }

  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailEnabled: true,
      inAppEnabled: true,
      digestFrequency: DigestFrequency.IMMEDIATE,
      notificationTypes: {
        [NotificationType.TASK_ASSIGNED]: true,
        [NotificationType.TASK_COMPLETED]: true,
        [NotificationType.APPROVAL_REQUESTED]: true,
        [NotificationType.APPROVAL_DECISION]: true,
        [NotificationType.COMMENT_MENTION]: true,
        [NotificationType.DEADLINE_APPROACHING]: true,
        [NotificationType.TASK_OVERDUE]: true,
        [NotificationType.PROJECT_UPDATE]: true,
        [NotificationType.TEAM_ANNOUNCEMENT]: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private parseMentions(text: string): string[] {
    const matches = text.matchAll(this.mentionRegex);
    return Array.from(matches, m => m[1]);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private formatTimeRemaining(days: number): string {
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // Mock methods - replace with actual database queries
  private async getUserEmail(userId: string): Promise<string | null> {
    // Mock implementation
    return `user${userId}@example.com`;
  }

  private async getUserName(userId: string): Promise<string> {
    // Mock implementation
    return `User ${userId}`;
  }

  private async getUsersByUsernames(usernames: string[]): Promise<User[]> {
    // Mock implementation
    return usernames.map((username, index) => ({
      id: `user_${index}`,
      email: `${username}@example.com`,
      name: username,
      role: { id: '1', name: 'Developer', description: '', permissions: [], level: 3 },
      permissions: [],
      createdAt: new Date(),
    }));
  }

  private async getProjectStakeholders(projectId: string): Promise<User[]> {
    // Mock implementation - return project managers and team leads
    return [];
  }

  private async getUpcomingDeadlineTasks(): Promise<Task[]> {
    // Mock implementation
    return [];
  }

  private async getOverdueTasks(): Promise<Task[]> {
    // Mock implementation
    return [];
  }

  private async getLastOverdueNotification(taskId: string, userId: string): Promise<Date | null> {
    // Mock implementation
    return null;
  }

  private emitNotificationEvent(notification: EmailNotification): void {
    // Emit real-time event through WebSocket
    // This would integrate with the existing socket.io setup
    if (typeof window !== 'undefined' && (window as any).socket) {
      (window as any).socket.emit('notification', notification);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export types for use in other modules
export type { NotificationService };