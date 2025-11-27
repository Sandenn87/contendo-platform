import { v4 as uuidv4 } from 'uuid';
import IORedis from 'ioredis';
import { BookingConfiguration, TeeTime, BookingResult } from '../types';
import logger from '../utils/logger';

interface ReleaseSchedule {
  enabled: boolean;
  releaseTime?: string;
  releaseDays?: number;
  timezone?: string;
}

export class BookingConfigurationManager {
  private redis: IORedis;
  private configs: Map<string, BookingConfiguration> = new Map();

  constructor(redis: IORedis) {
    this.redis = redis;
    this.loadConfigurations();
  }

  private async loadConfigurations(): Promise<void> {
    try {
      const keys = await this.redis.keys('config:*');
      
      for (const key of keys) {
        const configData = await this.redis.get(key);
        if (configData) {
          const config = JSON.parse(configData) as BookingConfiguration;
          // Convert date strings back to Date objects
          config.createdAt = new Date(config.createdAt);
          config.updatedAt = new Date(config.updatedAt);
          this.configs.set(config.id, config);
        }
      }

      logger.info('Loaded configurations from Redis', { count: this.configs.size });
    } catch (error) {
      logger.error('Failed to load configurations from Redis', error);
    }
  }

  async getAllConfigurations(): Promise<BookingConfiguration[]> {
    return Array.from(this.configs.values());
  }

  async getConfiguration(id: string): Promise<BookingConfiguration | null> {
    return this.configs.get(id) || null;
  }

  async getActiveConfigurations(): Promise<BookingConfiguration[]> {
    return Array.from(this.configs.values()).filter(config => config.isActive);
  }

  async createConfiguration(data: Partial<BookingConfiguration>): Promise<BookingConfiguration> {
    // Validate required fields
    if (!data.courseName || !data.authType || !data.preferredTime) {
      throw new Error('Missing required fields: courseName, authType, preferredTime');
    }

    if (!data.credentials || (!data.credentials.email && !data.credentials.partnerApiToken)) {
      throw new Error('Authentication credentials are required');
    }

    if (!data.playerNames || data.playerNames.length === 0) {
      throw new Error('At least one player name is required');
    }

    if (!data.dateRange || !data.dateRange.start || !data.dateRange.end) {
      throw new Error('Date range is required');
    }

    // Create configuration
    const config: BookingConfiguration = {
      id: uuidv4(),
      userId: 'default', // In a multi-user system, this would come from auth
      courseName: data.courseName,
      courseId: data.courseId,
      authType: data.authType as 'partner_api' | 'web',
      credentials: this.sanitizeCredentials(data.credentials),
      partySize: data.partySize || data.playerNames.length,
      playerNames: data.playerNames,
      preferredTime: data.preferredTime,
      timeFlexibility: data.timeFlexibility || 30,
      dateRange: {
        start: data.dateRange.start,
        end: data.dateRange.end
      },
      daysOfWeek: data.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      preferences: {
        walkingOrCart: data.preferences?.walkingOrCart || 'either',
        holes: data.preferences?.holes || 18,
        maxPrice: data.preferences?.maxPrice
      },
      teeTimeReleaseSchedule: data.teeTimeReleaseSchedule,
      notifications: {
        email: {
          enabled: data.notifications?.email?.enabled || false,
          address: data.notifications?.email?.address || ''
        },
        pushover: {
          enabled: data.notifications?.pushover?.enabled || false,
          userKey: data.notifications?.pushover?.userKey || '',
          appToken: data.notifications?.pushover?.appToken || ''
        }
      },
      polling: {
        enabled: data.polling?.enabled !== false,
        intervalSeconds: data.polling?.intervalSeconds || 90,
        maxRetries: data.polling?.maxRetries || 5
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: data.isActive !== false
    };

    // Validate configuration
    this.validateConfiguration(config);

    // Save to Redis and memory
    await this.saveConfiguration(config);
    this.configs.set(config.id, config);

    logger.info('Created configuration', {
      configId: config.id,
      courseName: config.courseName,
      authType: config.authType
    });

    return config;
  }

  async updateConfiguration(id: string, data: Partial<BookingConfiguration>): Promise<BookingConfiguration | null> {
    const existing = this.configs.get(id);
    if (!existing) {
      return null;
    }

    // Update configuration
    const updated: BookingConfiguration = {
      ...existing,
      ...data,
      id: existing.id, // Ensure ID doesn't change
      userId: existing.userId, // Ensure user doesn't change
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
      credentials: data.credentials ? this.sanitizeCredentials(data.credentials) : existing.credentials
    };

    // Validate updated configuration
    this.validateConfiguration(updated);

    // Save to Redis and memory
    await this.saveConfiguration(updated);
    this.configs.set(id, updated);

    logger.info('Updated configuration', { configId: id });

    return updated;
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    const config = this.configs.get(id);
    if (!config) {
      return false;
    }

    // Remove from Redis and memory
    await this.redis.del(`config:${id}`);
    this.configs.delete(id);

    logger.info('Deleted configuration', { configId: id });

    return true;
  }

  async toggleConfiguration(id: string, active: boolean): Promise<BookingConfiguration | null> {
    const config = this.configs.get(id);
    if (!config) {
      return null;
    }

    config.isActive = active;
    config.updatedAt = new Date();

    await this.saveConfiguration(config);
    this.configs.set(id, config);

    logger.info('Toggled configuration', { configId: id, active });

    return config;
  }

  async updateReleaseSchedule(id: string, schedule: ReleaseSchedule): Promise<ReleaseSchedule> {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Ensure required fields are present
    const validatedSchedule = {
      enabled: schedule.enabled,
      releaseTime: schedule.releaseTime || '06:00',
      releaseDays: schedule.releaseDays || 7,
      timezone: schedule.timezone || 'America/New_York'
    };

    config.teeTimeReleaseSchedule = validatedSchedule;
    config.updatedAt = new Date();

    await this.saveConfiguration(config);
    this.configs.set(id, config);

    logger.info('Updated release schedule', { configId: id, schedule });

    return validatedSchedule;
  }

  async exportConfigurations(): Promise<BookingConfiguration[]> {
    const configs = Array.from(this.configs.values());
    
    // Sanitize sensitive data for export
    return configs.map(config => ({
      ...config,
      credentials: {
        // Remove sensitive credential data
        email: config.credentials.email ? '***@***.***' : undefined,
        partnerApiToken: config.credentials.partnerApiToken ? '***' : undefined,
        orgId: config.credentials.orgId,
        facilityId: config.credentials.facilityId,
        courseId: config.credentials.courseId
      }
    }));
  }

  async importConfigurations(configurations: Partial<BookingConfiguration>[], overwrite: boolean = false): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const configData of configurations) {
      try {
        // Check if configuration already exists
        const existingId = configData.id;
        if (existingId && this.configs.has(existingId) && !overwrite) {
          result.skipped++;
          continue;
        }

        // Create or update configuration
        if (existingId && overwrite) {
          await this.updateConfiguration(existingId, configData);
        } else {
          await this.createConfiguration(configData);
        }

        result.imported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Configuration ${configData.courseName || 'unknown'}: ${errorMessage}`);
      }
    }

    logger.info('Imported configurations', result);

    return result;
  }

  // Get configurations that should be checked for tee time releases
  async getConfigurationsForReleaseCheck(): Promise<BookingConfiguration[]> {
    const now = new Date();
    
    return Array.from(this.configs.values()).filter(config => {
      if (!config.isActive || !config.teeTimeReleaseSchedule?.enabled) {
        return false;
      }

      // Check if it's time to check for releases
      const schedule = config.teeTimeReleaseSchedule;
      if (!schedule.releaseTime || !schedule.releaseDays) {
        return false;
      }

      // Calculate next release date
      const nextReleaseDate = new Date(now);
      nextReleaseDate.setDate(nextReleaseDate.getDate() + schedule.releaseDays);

      // Check if we're within the release time window
      const [releaseHour, releaseMinute] = schedule.releaseTime.split(':').map(Number);
      const releaseTime = new Date(now);
      releaseTime.setHours(releaseHour, releaseMinute, 0, 0);

      // Check if we're within 5 minutes of release time
      const timeDiff = Math.abs(now.getTime() - releaseTime.getTime());
      return timeDiff <= 5 * 60 * 1000; // 5 minutes
    });
  }

  private async saveConfiguration(config: BookingConfiguration): Promise<void> {
    try {
      await this.redis.set(`config:${config.id}`, JSON.stringify(config));
    } catch (error) {
      logger.error('Failed to save configuration to Redis', error, { configId: config.id });
      throw error;
    }
  }

  private validateConfiguration(config: BookingConfiguration): void {
    // Validate date range
    const startDate = new Date(config.dateRange.start);
    const endDate = new Date(config.dateRange.end);
    
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    if (startDate < new Date()) {
      throw new Error('Start date cannot be in the past');
    }

    // Validate preferred time
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(config.preferredTime)) {
      throw new Error('Invalid preferred time format (use HH:MM)');
    }

    // Validate party size
    if (config.partySize < 1 || config.partySize > 6) {
      throw new Error('Party size must be between 1 and 6');
    }

    if (config.playerNames.length > config.partySize) {
      throw new Error('Number of player names cannot exceed party size');
    }

    // Validate time flexibility
    if (config.timeFlexibility < 0 || config.timeFlexibility > 120) {
      throw new Error('Time flexibility must be between 0 and 120 minutes');
    }

    // Validate days of week
    if (config.daysOfWeek.length === 0) {
      throw new Error('At least one day of the week must be selected');
    }

    // Validate auth credentials based on type
    if (config.authType === 'partner_api') {
      if (!config.credentials.partnerApiToken || !config.credentials.orgId || !config.credentials.facilityId) {
        throw new Error('Partner API credentials are incomplete');
      }
    } else if (config.authType === 'web') {
      if (!config.credentials.email || !config.credentials.password) {
        throw new Error('Web authentication credentials are incomplete');
      }
    }

    // Validate release schedule if enabled
    if (config.teeTimeReleaseSchedule?.enabled) {
      if (!config.teeTimeReleaseSchedule.releaseTime || !config.teeTimeReleaseSchedule.releaseDays) {
        throw new Error('Release schedule is incomplete');
      }
      
      if (config.teeTimeReleaseSchedule.releaseDays < 1 || config.teeTimeReleaseSchedule.releaseDays > 30) {
        throw new Error('Release days must be between 1 and 30');
      }
    }
  }

  private sanitizeCredentials(credentials: any): any {
    // Create a copy to avoid modifying the original
    const sanitized = { ...credentials };
    
    // Don't store plaintext passwords in logs
    if (sanitized.password) {
      // In a real application, you'd want to encrypt this
      // For now, we'll just store it as-is but be careful in logs
    }
    
    return sanitized;
  }

  // Get configuration statistics
  async getStatistics(): Promise<{
    total: number;
    active: number;
    byAuthType: Record<string, number>;
    byCourse: Record<string, number>;
  }> {
    const configs = Array.from(this.configs.values());
    
    const stats = {
      total: configs.length,
      active: configs.filter(c => c.isActive).length,
      byAuthType: {} as Record<string, number>,
      byCourse: {} as Record<string, number>
    };

    // Count by auth type
    configs.forEach(config => {
      stats.byAuthType[config.authType] = (stats.byAuthType[config.authType] || 0) + 1;
      stats.byCourse[config.courseName] = (stats.byCourse[config.courseName] || 0) + 1;
    });

    return stats;
  }
}
