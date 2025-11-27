import nodemailer from 'nodemailer';
import axios from 'axios';
import { NotificationService, BookingResult, AppConfig } from '../types';
import logger from '../utils/logger';

export class EmailNotificationService implements NotificationService {
  private transporter: nodemailer.Transporter;
  private config: Required<NonNullable<AppConfig['notifications']['email']>>;

  constructor(emailConfig: AppConfig['notifications']['email']) {
    if (!emailConfig || !emailConfig.user || !emailConfig.to) {
      throw new Error('Email configuration is required with user and to fields');
    }
    
    this.config = emailConfig as Required<NonNullable<AppConfig['notifications']['email']>>;
    
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  async sendSuccess(booking: BookingResult): Promise<void> {
    try {
      const subject = '✅ Tee Time Booked Successfully!';
      const html = this.generateSuccessEmail(booking);
      
      await this.transporter.sendMail({
        from: this.config.user,
        to: this.config.to,
        subject,
        html,
      });
      
      logger.logNotificationSent('email', this.config.to, subject);
    } catch (error) {
      logger.error('Failed to send success email notification', error);
      throw error;
    }
  }

  async sendFailure(error: string, lastAttempt?: Date): Promise<void> {
    try {
      const subject = '❌ Tee Time Booking Failed';
      const html = this.generateFailureEmail(error, lastAttempt);
      
      await this.transporter.sendMail({
        from: this.config.user,
        to: this.config.to,
        subject,
        html,
      });
      
      logger.logNotificationSent('email', this.config.to, subject);
    } catch (err) {
      logger.error('Failed to send failure email notification', err);
      throw err;
    }
  }

  async sendHealthAlert(message: string): Promise<void> {
    try {
      const subject = '⚠️ ChronoAutoTee Health Alert';
      const html = this.generateHealthAlertEmail(message);
      
      await this.transporter.sendMail({
        from: this.config.user,
        to: this.config.to,
        subject,
        html,
      });
      
      logger.logNotificationSent('email', this.config.to, subject);
    } catch (error) {
      logger.error('Failed to send health alert email notification', error);
      throw error;
    }
  }

  private generateSuccessEmail(booking: BookingResult): string {
    const teeTime = booking.teeTime;
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">🎉 Tee Time Booked Successfully!</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Booking Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Confirmation Number:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${booking.confirmationNumber || booking.bookingId || 'N/A'}</td>
              </tr>
              ${teeTime ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Course:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${teeTime.courseName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${this.formatDate(teeTime.date)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${teeTime.time}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Holes:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">${teeTime.holes}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;"><strong>Price:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #ddd;">$${teeTime.price.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0;"><strong>Booked At:</strong></td>
                <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
            <p style="margin: 0; color: #0066cc;">
              <strong>Next Steps:</strong> Check your email for a confirmation from the golf course. 
              Make sure to arrive 30 minutes before your tee time.
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This notification was sent by ChronoAutoTee</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateFailureEmail(error: string, lastAttempt?: Date): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f44336; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">❌ Tee Time Booking Failed</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Error Details</h2>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; border-left: 4px solid #f44336;">
              <p style="margin: 0; color: #c62828;">${error}</p>
            </div>
            
            ${lastAttempt ? `
              <p style="margin-top: 15px; color: #666;">
                <strong>Last Attempt:</strong> ${lastAttempt.toLocaleString()}
              </p>
            ` : ''}
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
            <p style="margin: 0; color: #e65100;">
              <strong>What's Next:</strong> ChronoAutoTee will continue trying to book your tee time. 
              Check your configuration if errors persist.
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This notification was sent by ChronoAutoTee</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateHealthAlertEmail(message: string): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ff9800; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">⚠️ ChronoAutoTee Health Alert</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #333; margin-top: 0;">Alert Details</h2>
            <div style="background-color: #fff3e0; padding: 15px; border-radius: 4px; border-left: 4px solid #ff9800;">
              <p style="margin: 0; color: #e65100;">${message}</p>
            </div>
            
            <p style="margin-top: 15px; color: #666;">
              <strong>Time:</strong> ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 4px;">
            <p style="margin: 0; color: #0066cc;">
              <strong>Action Required:</strong> Please check your ChronoAutoTee service and resolve any issues.
            </p>
          </div>
          
          <div style="margin-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>This notification was sent by ChronoAutoTee</p>
          </div>
        </body>
      </html>
    `;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export class PushoverNotificationService implements NotificationService {
  private config: Required<NonNullable<AppConfig['notifications']['pushover']>>;
  private apiUrl = 'https://api.pushover.net/1/messages.json';

  constructor(pushoverConfig: AppConfig['notifications']['pushover']) {
    if (!pushoverConfig || !pushoverConfig.token || !pushoverConfig.user) {
      throw new Error('Pushover configuration is required with token and user fields');
    }
    this.config = pushoverConfig as Required<NonNullable<AppConfig['notifications']['pushover']>>;
  }

  async sendSuccess(booking: BookingResult): Promise<void> {
    try {
      const message = this.generateSuccessMessage(booking);
      
      await this.sendPushoverMessage({
        message,
        title: '✅ Tee Time Booked!',
        priority: 1,
        sound: 'success'
      });
      
      logger.logNotificationSent('pushover', this.config.user, 'Tee Time Booked');
    } catch (error) {
      logger.error('Failed to send success Pushover notification', error);
      throw error;
    }
  }

  async sendFailure(error: string, lastAttempt?: Date): Promise<void> {
    try {
      const message = `Booking failed: ${error}${lastAttempt ? `\nLast attempt: ${lastAttempt.toLocaleString()}` : ''}`;
      
      await this.sendPushoverMessage({
        message,
        title: '❌ Booking Failed',
        priority: 1,
        sound: 'siren'
      });
      
      logger.logNotificationSent('pushover', this.config.user, 'Booking Failed');
    } catch (err) {
      logger.error('Failed to send failure Pushover notification', err);
      throw err;
    }
  }

  async sendHealthAlert(message: string): Promise<void> {
    try {
      await this.sendPushoverMessage({
        message: `Health Alert: ${message}`,
        title: '⚠️ ChronoAutoTee Alert',
        priority: 1,
        sound: 'persistent'
      });
      
      logger.logNotificationSent('pushover', this.config.user, 'Health Alert');
    } catch (error) {
      logger.error('Failed to send health alert Pushover notification', error);
      throw error;
    }
  }

  private generateSuccessMessage(booking: BookingResult): string {
    const teeTime = booking.teeTime;
    if (!teeTime) {
      return `Tee time booked successfully!\nConfirmation: ${booking.confirmationNumber || booking.bookingId}`;
    }
    
    return `🎉 Tee time booked at ${teeTime.courseName}!\n` +
           `📅 ${this.formatDate(teeTime.date)} at ${teeTime.time}\n` +
           `⛳ ${teeTime.holes} holes - $${teeTime.price.toFixed(2)}\n` +
           `🎫 Confirmation: ${booking.confirmationNumber || booking.bookingId || 'N/A'}`;
  }

  private async sendPushoverMessage(params: {
    message: string;
    title: string;
    priority: number;
    sound: string;
  }): Promise<void> {
    try {
      const response = await axios.post(this.apiUrl, {
        token: this.config.token,
        user: this.config.user,
        message: params.message,
        title: params.title,
        priority: params.priority,
        sound: params.sound,
      });

      if (response.data.status !== 1) {
        throw new Error(`Pushover API error: ${response.data.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Pushover API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

export class CompositeNotificationService implements NotificationService {
  private services: NotificationService[];

  constructor(services: NotificationService[]) {
    this.services = services;
  }

  async sendSuccess(booking: BookingResult): Promise<void> {
    const promises = this.services.map(service => 
      service.sendSuccess(booking).catch(error => 
        logger.error(`Notification service failed`, error)
      )
    );
    await Promise.allSettled(promises);
  }

  async sendFailure(error: string, lastAttempt?: Date): Promise<void> {
    const promises = this.services.map(service => 
      service.sendFailure(error, lastAttempt).catch(err => 
        logger.error(`Notification service failed`, err)
      )
    );
    await Promise.allSettled(promises);
  }

  async sendHealthAlert(message: string): Promise<void> {
    const promises = this.services.map(service => 
      service.sendHealthAlert(message).catch(error => 
        logger.error(`Notification service failed`, error)
      )
    );
    await Promise.allSettled(promises);
  }
}

export function createNotificationService(config: AppConfig): NotificationService {
  const services: NotificationService[] = [];
  
  if (config.notifications.email) {
    services.push(new EmailNotificationService(config.notifications.email));
  }
  
  if (config.notifications.pushover) {
    services.push(new PushoverNotificationService(config.notifications.pushover));
  }
  
  if (services.length === 0) {
    logger.warn('No notification services configured');
    return {
      async sendSuccess() {},
      async sendFailure() {},
      async sendHealthAlert() {},
    };
  }
  
  if (services.length === 1) {
    return services[0];
  }
  
  return new CompositeNotificationService(services);
}
