export interface EmailNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  htmlContent?: string;
  metadata: NotificationMetadata;
  status: NotificationStatus;
  priority: NotificationPriority;
  readAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_DECISION = 'APPROVAL_DECISION',
  COMMENT_MENTION = 'COMMENT_MENTION',
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING',
  TASK_OVERDUE = 'TASK_OVERDUE',
  PROJECT_UPDATE = 'PROJECT_UPDATE',
  TEAM_ANNOUNCEMENT = 'TEAM_ANNOUNCEMENT',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface NotificationMetadata {
  projectId?: string;
  taskId?: string;
  taskName?: string;
  commentId?: string;
  updateId?: string;
  fromUserId?: string;
  fromUserName?: string;
  fromUserAvatar?: string;
  dueDate?: Date;
  actionUrl?: string;
  actionLabel?: string;
  additionalData?: Record<string, any>;
}

export interface NotificationTemplate {
  type: NotificationType;
  subject: string;
  bodyTemplate: string;
  htmlTemplate: string;
  priority: NotificationPriority;
  actionLabel?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  digestFrequency: DigestFrequency;
  notificationTypes: {
    [key in NotificationType]: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export enum DigestFrequency {
  IMMEDIATE = 'IMMEDIATE',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  NEVER = 'NEVER',
}

export interface EmailQueue {
  id: string;
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  priority: NotificationPriority;
  attempts: number;
  status: EmailStatus;
  scheduledFor?: Date;
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum EmailStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface NotificationFilter {
  types?: NotificationType[];
  status?: NotificationStatus;
  priority?: NotificationPriority;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  [NotificationType.TASK_ASSIGNED]: {
    type: NotificationType.TASK_ASSIGNED,
    subject: 'New Task Assigned: {{taskName}}',
    bodyTemplate: '{{fromUserName}} has assigned you a new task "{{taskName}}" in project {{projectName}}.',
    htmlTemplate: `
      <h3>New Task Assignment</h3>
      <p><strong>{{fromUserName}}</strong> has assigned you a new task:</p>
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0;">{{taskName}}</h4>
        <p style="margin: 0; color: #666;">Project: {{projectName}}</p>
        {{#if dueDate}}
        <p style="margin: 8px 0 0 0; color: #666;">Due: {{dueDate}}</p>
        {{/if}}
      </div>
    `,
    priority: NotificationPriority.MEDIUM,
    actionLabel: 'View Task',
  },
  [NotificationType.TASK_COMPLETED]: {
    type: NotificationType.TASK_COMPLETED,
    subject: 'Task Completed: {{taskName}}',
    bodyTemplate: '{{fromUserName}} has completed the task "{{taskName}}" in project {{projectName}}.',
    htmlTemplate: `
      <h3>Task Completed</h3>
      <p><strong>{{fromUserName}}</strong> has completed the task:</p>
      <div style="background-color: #e8f5e9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #2e7d32;">✓ {{taskName}}</h4>
        <p style="margin: 0; color: #666;">Project: {{projectName}}</p>
      </div>
    `,
    priority: NotificationPriority.LOW,
    actionLabel: 'View Task',
  },
  [NotificationType.APPROVAL_REQUESTED]: {
    type: NotificationType.APPROVAL_REQUESTED,
    subject: 'Approval Required: {{taskName}}',
    bodyTemplate: '{{fromUserName}} has requested your approval for changes to "{{taskName}}".',
    htmlTemplate: `
      <h3>Approval Required</h3>
      <p><strong>{{fromUserName}}</strong> has requested your approval:</p>
      <div style="background-color: #fff3e0; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #e65100;">{{taskName}}</h4>
        <p style="margin: 0; color: #666;">Project: {{projectName}}</p>
        <p style="margin: 8px 0 0 0; color: #666;">{{changeDescription}}</p>
      </div>
    `,
    priority: NotificationPriority.HIGH,
    actionLabel: 'Review & Approve',
  },
  [NotificationType.APPROVAL_DECISION]: {
    type: NotificationType.APPROVAL_DECISION,
    subject: 'Update {{decision}}: {{taskName}}',
    bodyTemplate: '{{fromUserName}} has {{decision}} your update to "{{taskName}}".',
    htmlTemplate: `
      <h3>Approval Decision</h3>
      <p><strong>{{fromUserName}}</strong> has <strong>{{decision}}</strong> your update:</p>
      <div style="background-color: {{#if approved}}#e8f5e9{{else}}#ffebee{{/if}}; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: {{#if approved}}#2e7d32{{else}}#c62828{{/if}};">
          {{#if approved}}✓ Approved{{else}}✗ Rejected{{/if}}: {{taskName}}
        </h4>
        <p style="margin: 0; color: #666;">Project: {{projectName}}</p>
        {{#if comments}}
        <p style="margin: 8px 0 0 0; color: #666;">Comments: {{comments}}</p>
        {{/if}}
      </div>
    `,
    priority: NotificationPriority.MEDIUM,
    actionLabel: 'View Update',
  },
  [NotificationType.COMMENT_MENTION]: {
    type: NotificationType.COMMENT_MENTION,
    subject: '{{fromUserName}} mentioned you in {{taskName}}',
    bodyTemplate: '{{fromUserName}} mentioned you in a comment on "{{taskName}}": "{{commentPreview}}"',
    htmlTemplate: `
      <h3>You were mentioned</h3>
      <p><strong>{{fromUserName}}</strong> mentioned you in a comment:</p>
      <div style="background-color: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0;">{{taskName}}</h4>
        <p style="margin: 8px 0; font-style: italic; color: #333;">"{{commentText}}"</p>
        <p style="margin: 0; color: #666; font-size: 12px;">Project: {{projectName}}</p>
      </div>
    `,
    priority: NotificationPriority.MEDIUM,
    actionLabel: 'View Comment',
  },
  [NotificationType.DEADLINE_APPROACHING]: {
    type: NotificationType.DEADLINE_APPROACHING,
    subject: 'Deadline Approaching: {{taskName}}',
    bodyTemplate: 'Task "{{taskName}}" is due {{timeRemaining}}. Current progress: {{progress}}%',
    htmlTemplate: `
      <h3>Deadline Approaching</h3>
      <p>The following task is due soon:</p>
      <div style="background-color: #fff8e1; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #f57c00;">⏰ {{taskName}}</h4>
        <p style="margin: 0; color: #666;">Due: <strong>{{dueDate}}</strong> ({{timeRemaining}})</p>
        <p style="margin: 8px 0 0 0; color: #666;">Progress: {{progress}}%</p>
        <p style="margin: 4px 0 0 0; color: #666;">Project: {{projectName}}</p>
      </div>
    `,
    priority: NotificationPriority.HIGH,
    actionLabel: 'View Task',
  },
  [NotificationType.TASK_OVERDUE]: {
    type: NotificationType.TASK_OVERDUE,
    subject: 'Task Overdue: {{taskName}}',
    bodyTemplate: 'Task "{{taskName}}" is now {{daysOverdue}} days overdue. Current progress: {{progress}}%',
    htmlTemplate: `
      <h3>Task Overdue</h3>
      <p>The following task is overdue:</p>
      <div style="background-color: #ffebee; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0; color: #d32f2f;">⚠️ {{taskName}}</h4>
        <p style="margin: 0; color: #666;">Was due: <strong>{{dueDate}}</strong> ({{daysOverdue}} days ago)</p>
        <p style="margin: 8px 0 0 0; color: #666;">Progress: {{progress}}%</p>
        <p style="margin: 4px 0 0 0; color: #666;">Project: {{projectName}}</p>
        {{#if assigneeName}}
        <p style="margin: 4px 0 0 0; color: #666;">Assigned to: {{assigneeName}}</p>
        {{/if}}
      </div>
    `,
    priority: NotificationPriority.URGENT,
    actionLabel: 'Update Task',
  },
  [NotificationType.PROJECT_UPDATE]: {
    type: NotificationType.PROJECT_UPDATE,
    subject: 'Project Update: {{projectName}}',
    bodyTemplate: '{{updateSummary}}',
    htmlTemplate: `
      <h3>Project Update</h3>
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0;">{{projectName}}</h4>
        <p style="margin: 0;">{{updateDescription}}</p>
      </div>
    `,
    priority: NotificationPriority.MEDIUM,
    actionLabel: 'View Project',
  },
  [NotificationType.TEAM_ANNOUNCEMENT]: {
    type: NotificationType.TEAM_ANNOUNCEMENT,
    subject: 'Team Announcement: {{title}}',
    bodyTemplate: '{{announcementText}}',
    htmlTemplate: `
      <h3>Team Announcement</h3>
      <p>From: <strong>{{fromUserName}}</strong></p>
      <div style="background-color: #e8eaf6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4 style="margin: 0 0 8px 0;">{{title}}</h4>
        <p style="margin: 0;">{{announcementText}}</p>
      </div>
    `,
    priority: NotificationPriority.MEDIUM,
  },
};