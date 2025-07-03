import { 
  EmailNotification, 
  EmailQueue, 
  EmailStatus, 
  NotificationTemplate, 
  NotificationType, 
  NotificationPriority,
  NotificationPreferences,
  DigestFrequency,
  NOTIFICATION_TEMPLATES 
} from '@/types/notification';

// Mock email service - in production, this would integrate with SendGrid, AWS SES, etc.
class EmailService {
  private emailQueue: Map<string, EmailQueue> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private rateLimiter: Map<string, number> = new Map();
  private readonly MAX_EMAILS_PER_HOUR = 100;
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 10;

  constructor() {
    // Start processing queue every 30 seconds
    this.startQueueProcessor();
  }

  // Queue an email for sending
  async queueEmail(
    to: string,
    notification: EmailNotification,
    preferences?: NotificationPreferences
  ): Promise<string> {
    // Check user preferences
    if (preferences && !this.shouldSendEmail(notification, preferences)) {
      console.log(`Email not sent due to user preferences: ${to}`);
      return '';
    }

    // Check rate limits
    if (!this.checkRateLimit(to)) {
      throw new Error('Rate limit exceeded for user');
    }

    const template = NOTIFICATION_TEMPLATES[notification.type];
    const { subject, htmlContent, textContent } = this.renderTemplate(template, notification);

    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const email: EmailQueue = {
      id: emailId,
      to,
      subject,
      htmlContent,
      textContent,
      priority: notification.priority,
      attempts: 0,
      status: EmailStatus.PENDING,
      metadata: {
        notificationId: notification.id,
        notificationType: notification.type,
        userId: notification.userId,
      },
      scheduledFor: this.getScheduledTime(preferences),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.emailQueue.set(emailId, email);
    return emailId;
  }

  // Batch queue multiple emails
  async batchQueueEmails(
    emails: Array<{
      to: string;
      notification: EmailNotification;
      preferences?: NotificationPreferences;
    }>
  ): Promise<string[]> {
    const emailIds: string[] = [];
    
    for (const { to, notification, preferences } of emails) {
      try {
        const emailId = await this.queueEmail(to, notification, preferences);
        if (emailId) emailIds.push(emailId);
      } catch (error) {
        console.error(`Failed to queue email for ${to}:`, error);
      }
    }
    
    return emailIds;
  }

  // Process email queue
  private async processQueue(): Promise<void> {
    const pendingEmails = Array.from(this.emailQueue.values())
      .filter(email => 
        email.status === EmailStatus.PENDING && 
        (!email.scheduledFor || email.scheduledFor <= new Date())
      )
      .sort((a, b) => {
        // Sort by priority first, then by creation date
        const priorityOrder = {
          [NotificationPriority.URGENT]: 0,
          [NotificationPriority.HIGH]: 1,
          [NotificationPriority.MEDIUM]: 2,
          [NotificationPriority.LOW]: 3,
        };
        
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, this.BATCH_SIZE);

    for (const email of pendingEmails) {
      await this.sendEmail(email);
    }
  }

  // Send individual email
  private async sendEmail(email: EmailQueue): Promise<void> {
    try {
      // Update status to processing
      email.status = EmailStatus.PROCESSING;
      email.updatedAt = new Date();
      this.emailQueue.set(email.id, email);

      // Mock sending email - in production, this would call the email provider API
      await this.mockSendEmail(email);

      // Mark as sent
      email.status = EmailStatus.SENT;
      email.sentAt = new Date();
      email.updatedAt = new Date();
      this.emailQueue.set(email.id, email);

      // Update rate limiter
      this.updateRateLimit(email.to);

      console.log(`Email sent successfully: ${email.id} to ${email.to}`);
    } catch (error) {
      email.attempts++;
      email.error = error instanceof Error ? error.message : 'Unknown error';
      email.updatedAt = new Date();

      if (email.attempts >= this.MAX_RETRIES) {
        email.status = EmailStatus.FAILED;
      } else {
        email.status = EmailStatus.PENDING;
        // Exponential backoff for retries
        email.scheduledFor = new Date(Date.now() + Math.pow(2, email.attempts) * 60000);
      }

      this.emailQueue.set(email.id, email);
      console.error(`Failed to send email ${email.id}:`, error);
    }
  }

  // Mock email sending - replace with actual email provider integration
  private async mockSendEmail(email: EmailQueue): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
      throw new Error('Mock email send failed');
    }

    // In production, this would:
    // 1. Call the email provider API (SendGrid, AWS SES, etc.)
    // 2. Handle authentication
    // 3. Format the email properly
    // 4. Track delivery status
    console.log(`[MOCK] Sending email to ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Priority: ${email.priority}`);
  }

  // Render email template
  private renderTemplate(
    template: NotificationTemplate,
    notification: EmailNotification
  ): { subject: string; htmlContent: string; textContent: string } {
    const data = {
      ...notification.metadata,
      ...notification.metadata.additionalData,
    };

    // Simple template rendering - in production, use a proper template engine
    const renderString = (str: string): string => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = data[key];
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        return value?.toString() || '';
      });
    };

    // Handle conditional rendering in HTML
    const renderHtml = (html: string): string => {
      // Simple if/else handling
      html = html.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
        return data[key] ? content : '';
      });
      
      // Handle if/else blocks
      html = html.replace(
        /\{\{#if (\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (match, key, ifContent, elseContent) => {
          return data[key] ? ifContent : elseContent;
        }
      );
      
      return renderString(html);
    };

    const subject = renderString(template.subject);
    const textContent = renderString(notification.message || template.bodyTemplate);
    const htmlContent = this.wrapEmailTemplate(
      renderHtml(notification.htmlContent || template.htmlTemplate),
      template.actionLabel,
      notification.metadata.actionUrl
    );

    return { subject, htmlContent, textContent };
  }

  // Wrap email content in a base template
  private wrapEmailTemplate(content: string, actionLabel?: string, actionUrl?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 32px;
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .content {
            margin-bottom: 32px;
          }
          .action-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 16px;
          }
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid #e5e5e5;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .footer a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">ImpactFlow Pro</div>
          </div>
          <div class="content">
            ${content}
            ${actionUrl && actionLabel ? `
              <div style="text-align: center; margin-top: 24px;">
                <a href="${actionUrl}" class="action-button">${actionLabel}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>You're receiving this email because you have notifications enabled for ImpactFlow Pro.</p>
            <p><a href="#">Manage notification preferences</a> | <a href="#">Unsubscribe</a></p>
            <p>&copy; ${new Date().getFullYear()} ImpactFlow Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Check if email should be sent based on preferences
  private shouldSendEmail(
    notification: EmailNotification,
    preferences: NotificationPreferences
  ): boolean {
    // Check if email notifications are enabled
    if (!preferences.emailEnabled) return false;

    // Check if this notification type is enabled
    if (!preferences.notificationTypes[notification.type]) return false;

    // Check quiet hours
    if (preferences.quietHours?.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      const [startHour, startMin] = preferences.quietHours.startTime.split(':').map(Number);
      const [endHour, endMin] = preferences.quietHours.endTime.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      // Handle overnight quiet hours
      if (startTime > endTime) {
        if (currentTime >= startTime || currentTime <= endTime) return false;
      } else {
        if (currentTime >= startTime && currentTime <= endTime) return false;
      }
    }

    return true;
  }

  // Get scheduled time based on digest preferences
  private getScheduledTime(preferences?: NotificationPreferences): Date | undefined {
    if (!preferences || preferences.digestFrequency === DigestFrequency.IMMEDIATE) {
      return undefined;
    }

    const now = new Date();
    
    switch (preferences.digestFrequency) {
      case DigestFrequency.HOURLY:
        // Schedule for the next hour
        const nextHour = new Date(now);
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        return nextHour;
        
      case DigestFrequency.DAILY:
        // Schedule for 9 AM next day
        const nextDay = new Date(now);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(9, 0, 0, 0);
        return nextDay;
        
      case DigestFrequency.WEEKLY:
        // Schedule for Monday 9 AM
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 0, 0, 0);
        return nextMonday;
        
      default:
        return undefined;
    }
  }

  // Rate limiting
  private checkRateLimit(email: string): boolean {
    const key = `${email}_${new Date().getHours()}`;
    const count = this.rateLimiter.get(key) || 0;
    return count < this.MAX_EMAILS_PER_HOUR;
  }

  private updateRateLimit(email: string): void {
    const key = `${email}_${new Date().getHours()}`;
    const count = this.rateLimiter.get(key) || 0;
    this.rateLimiter.set(key, count + 1);
  }

  // Queue processor lifecycle
  private startQueueProcessor(): void {
    if (this.processingInterval) return;
    
    this.processingInterval = setInterval(() => {
      this.processQueue().catch(console.error);
    }, 30000); // Process every 30 seconds
  }

  stopQueueProcessor(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Get queue statistics
  getQueueStats(): {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    total: number;
  } {
    const emails = Array.from(this.emailQueue.values());
    return {
      pending: emails.filter(e => e.status === EmailStatus.PENDING).length,
      processing: emails.filter(e => e.status === EmailStatus.PROCESSING).length,
      sent: emails.filter(e => e.status === EmailStatus.SENT).length,
      failed: emails.filter(e => e.status === EmailStatus.FAILED).length,
      total: emails.length,
    };
  }

  // Clean up old emails from queue
  cleanupQueue(daysToKeep: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    for (const [id, email] of this.emailQueue.entries()) {
      if (
        (email.status === EmailStatus.SENT || email.status === EmailStatus.FAILED) &&
        email.updatedAt < cutoffDate
      ) {
        this.emailQueue.delete(id);
      }
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types for use in other modules
export type { EmailService };