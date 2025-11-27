import IORedis from 'ioredis';
import { z } from 'zod';
import logger from '../utils/logger';

interface AppSettings {
  // Notification settings
  emailNotifications: boolean;
  notificationEmail: string;
  pushoverNotifications: boolean;
  pushoverUserKey: string;
  pushoverAppToken: string;

  // SMTP settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;

  // System settings
  defaultPollingInterval: number;
  maxRetries: number;
  teeTimeReleaseBuffer: number;
  rateLimitingEnabled: boolean;
  rateLimitRequestsPerMinute: number;

  // UI settings
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';

  // Advanced settings
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxHistoryDays: number;
  backupFrequency: 'daily' | 'weekly' | 'monthly' | 'disabled';
  autoCleanupEnabled: boolean;
}

// Settings validation schema
const settingsSchema = z.object({
  // Notification settings
  emailNotifications: z.boolean().default(false),
  notificationEmail: z.string().email().or(z.literal('')).optional().default(''),
  pushoverNotifications: z.boolean().default(false),
  pushoverUserKey: z.string().optional().default(''),
  pushoverAppToken: z.string().optional().default(''),

  // SMTP settings
  smtpHost: z.string().default('smtp.gmail.com'),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpUser: z.string().default(''),
  smtpPass: z.string().default(''),

  // System settings
  defaultPollingInterval: z.number().int().min(30).max(3600).default(90),
  maxRetries: z.number().int().min(1).max(10).default(5),
  teeTimeReleaseBuffer: z.number().int().min(1).max(60).default(5),
  rateLimitingEnabled: z.boolean().default(true),
  rateLimitRequestsPerMinute: z.number().int().min(10).max(1000).default(100),

  // UI settings
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  timezone: z.string().default('America/New_York'),
  dateFormat: z.string().default('MM/DD/YYYY'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),

  // Advanced settings
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  maxHistoryDays: z.number().int().min(7).max(365).default(90),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly', 'disabled']).default('weekly'),
  autoCleanupEnabled: z.boolean().default(true)
});

export class SettingsManager {
  private redis: IORedis;
  private settings: AppSettings;
  private readonly settingsKey = 'app:settings';

  constructor(redis: IORedis) {
    this.redis = redis;
    this.settings = this.getDefaultSettings();
    this.loadSettings();
  }

  private getDefaultSettings(): AppSettings {
    return settingsSchema.parse({});
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsData = await this.redis.get(this.settingsKey);
      
      if (settingsData) {
        const parsedSettings = JSON.parse(settingsData);
        this.settings = settingsSchema.parse(parsedSettings);
        logger.info('Loaded application settings from Redis');
      } else {
        // Save default settings if none exist
        await this.saveSettings();
        logger.info('Initialized default application settings');
      }
    } catch (error) {
      logger.error('Failed to load settings from Redis, using defaults', error);
      this.settings = this.getDefaultSettings();
    }
  }

  async getSettings(): Promise<AppSettings> {
    // Return a copy to prevent external modification
    return { ...this.settings };
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
      // Merge with existing settings
      const newSettings = { ...this.settings, ...updates };
      
      // Validate the updated settings
      this.settings = settingsSchema.parse(newSettings);
      
      // Save to Redis
      await this.saveSettings();
      
      logger.info('Updated application settings', {
        updatedFields: Object.keys(updates)
      });

      return { ...this.settings };
    } catch (error) {
      logger.error('Failed to update settings', error);
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Invalid settings: ${errorMessages.join(', ')}`);
      }
      
      throw error;
    }
  }

  async resetSettings(): Promise<AppSettings> {
    try {
      this.settings = this.getDefaultSettings();
      await this.saveSettings();
      
      logger.info('Reset application settings to defaults');
      return { ...this.settings };
    } catch (error) {
      logger.error('Failed to reset settings', error);
      throw error;
    }
  }

  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    return this.settings[key];
  }

  async setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    try {
      const updates = { [key]: value } as Partial<AppSettings>;
      await this.updateSettings(updates);
    } catch (error) {
      logger.error('Failed to set individual setting', error, { key, value });
      throw error;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await this.redis.set(this.settingsKey, JSON.stringify(this.settings));
    } catch (error) {
      logger.error('Failed to save settings to Redis', error);
      throw error;
    }
  }

  // Get notification configuration for use by other services
  async getNotificationConfig(): Promise<{
    email?: {
      enabled: boolean;
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
      to: string;
    };
    pushover?: {
      enabled: boolean;
      token: string;
      user: string;
    };
  }> {
    const config: any = {};

    if (this.settings.emailNotifications && this.settings.notificationEmail && this.settings.smtpUser) {
      config.email = {
        enabled: true,
        host: this.settings.smtpHost,
        port: this.settings.smtpPort,
        secure: this.settings.smtpPort === 465,
        user: this.settings.smtpUser,
        pass: this.settings.smtpPass,
        to: this.settings.notificationEmail
      };
    }

    if (this.settings.pushoverNotifications && this.settings.pushoverUserKey && this.settings.pushoverAppToken) {
      config.pushover = {
        enabled: true,
        token: this.settings.pushoverAppToken,
        user: this.settings.pushoverUserKey
      };
    }

    return config;
  }

  // Get system configuration for use by other services
  async getSystemConfig(): Promise<{
    defaultPollingInterval: number;
    maxRetries: number;
    teeTimeReleaseBuffer: number;
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
    };
    logLevel: string;
    maxHistoryDays: number;
    autoCleanupEnabled: boolean;
  }> {
    return {
      defaultPollingInterval: this.settings.defaultPollingInterval,
      maxRetries: this.settings.maxRetries,
      teeTimeReleaseBuffer: this.settings.teeTimeReleaseBuffer,
      rateLimiting: {
        enabled: this.settings.rateLimitingEnabled,
        requestsPerMinute: this.settings.rateLimitRequestsPerMinute
      },
      logLevel: this.settings.logLevel,
      maxHistoryDays: this.settings.maxHistoryDays,
      autoCleanupEnabled: this.settings.autoCleanupEnabled
    };
  }

  // Validate notification settings by testing them
  async validateNotificationSettings(): Promise<{
    email: { valid: boolean; error?: string };
    pushover: { valid: boolean; error?: string };
  }> {
    const result = {
      email: { valid: false, error: undefined as string | undefined },
      pushover: { valid: false, error: undefined as string | undefined }
    };

    // Validate email settings
    if (this.settings.emailNotifications) {
      try {
        if (!this.settings.notificationEmail) {
          result.email.error = 'Notification email address is required';
        } else if (!this.settings.smtpUser || !this.settings.smtpPass) {
          result.email.error = 'SMTP credentials are required';
        } else if (!this.settings.smtpHost) {
          result.email.error = 'SMTP host is required';
        } else {
          result.email.valid = true;
        }
      } catch (error) {
        result.email.error = error instanceof Error ? error.message : 'Email validation failed';
      }
    } else {
      result.email.valid = true; // Not enabled, so considered valid
    }

    // Validate Pushover settings
    if (this.settings.pushoverNotifications) {
      try {
        if (!this.settings.pushoverUserKey) {
          result.pushover.error = 'Pushover user key is required';
        } else if (!this.settings.pushoverAppToken) {
          result.pushover.error = 'Pushover app token is required';
        } else {
          result.pushover.valid = true;
        }
      } catch (error) {
        result.pushover.error = error instanceof Error ? error.message : 'Pushover validation failed';
      }
    } else {
      result.pushover.valid = true; // Not enabled, so considered valid
    }

    return result;
  }

  // Export settings for backup
  async exportSettings(): Promise<AppSettings> {
    // Return settings with sensitive data masked
    const exported = { ...this.settings };
    
    // Mask sensitive fields
    if (exported.smtpPass) {
      exported.smtpPass = '***';
    }
    if (exported.pushoverAppToken) {
      exported.pushoverAppToken = '***';
    }
    if (exported.pushoverUserKey) {
      exported.pushoverUserKey = '***';
    }

    return exported;
  }

  // Import settings from backup (excluding sensitive data)
  async importSettings(importedSettings: Partial<AppSettings>, includeSensitive: boolean = false): Promise<AppSettings> {
    try {
      const settingsToImport = { ...importedSettings };
      
      // Remove sensitive fields if not explicitly including them
      if (!includeSensitive) {
        delete settingsToImport.smtpPass;
        delete settingsToImport.pushoverAppToken;
        delete settingsToImport.pushoverUserKey;
      }

      return await this.updateSettings(settingsToImport);
    } catch (error) {
      logger.error('Failed to import settings', error);
      throw error;
    }
  }

  // Get settings validation schema for frontend
  getSettingsSchema(): any {
    return settingsSchema;
  }

  // Listen for settings changes and emit events
  onSettingsChange(callback: (settings: AppSettings) => void): void {
    // In a real implementation, you might use Redis pub/sub or event emitters
    // For now, this is a placeholder for the callback registration
    logger.debug('Settings change callback registered');
  }

  // Health check for settings service
  async isHealthy(): Promise<boolean> {
    try {
      // Test Redis connection
      await this.redis.ping();
      
      // Validate current settings
      settingsSchema.parse(this.settings);
      
      return true;
    } catch (error) {
      logger.error('Settings service health check failed', error);
      return false;
    }
  }
}

