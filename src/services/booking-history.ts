import IORedis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { BookingHistory, TeeTime, BookingResult } from '../types';
import logger from '../utils/logger';

interface HistoryFilters {
  configurationId?: string;
  status?: 'pending' | 'success' | 'failed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface AnalyticsSummary {
  totalAttempts: number;
  successfulBookings: number;
  failedBookings: number;
  successRate: number;
  averagePrice: number;
  topCourses: Array<{ courseName: string; bookings: number }>;
  recentActivity: BookingHistory[];
}

interface CourseAnalytics {
  courseName: string;
  totalAttempts: number;
  successfulBookings: number;
  successRate: number;
  averagePrice: number;
  priceRange: { min: number; max: number };
  preferredTimes: Array<{ time: string; count: number }>;
  monthlyStats: Array<{ month: string; bookings: number }>;
}

export class BookingHistoryService {
  private redis: IORedis;
  private history: Map<string, BookingHistory> = new Map();

  constructor(redis: IORedis) {
    this.redis = redis;
    this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    try {
      const keys = await this.redis.keys('history:*');
      
      for (const key of keys) {
        const historyData = await this.redis.get(key);
        if (historyData) {
          const history = JSON.parse(historyData) as BookingHistory;
          // Convert date strings back to Date objects
          history.attemptedAt = new Date(history.attemptedAt);
          if (history.completedAt) {
            history.completedAt = new Date(history.completedAt);
          }
          this.history.set(history.id, history);
        }
      }

      logger.info('Loaded booking history from Redis', { count: this.history.size });
    } catch (error) {
      logger.error('Failed to load booking history from Redis', error);
    }
  }

  async addBookingAttempt(
    configurationId: string,
    teeTime: TeeTime,
    status: 'pending' | 'success' | 'failed' = 'pending'
  ): Promise<BookingHistory> {
    const historyEntry: BookingHistory = {
      id: uuidv4(),
      configurationId,
      teeTime,
      bookingResult: {
        success: status === 'success',
        message: status === 'pending' ? 'Booking in progress' : 
                status === 'success' ? 'Booking successful' : 'Booking failed'
      },
      attemptedAt: new Date(),
      status
    };

    await this.saveHistoryEntry(historyEntry);
    this.history.set(historyEntry.id, historyEntry);

    logger.info('Added booking attempt to history', {
      historyId: historyEntry.id,
      configurationId,
      status
    });

    return historyEntry;
  }

  async updateBookingResult(
    historyId: string,
    result: BookingResult,
    status: 'success' | 'failed' | 'cancelled'
  ): Promise<BookingHistory | null> {
    const historyEntry = this.history.get(historyId);
    if (!historyEntry) {
      logger.warn('Booking history entry not found for update', { historyId });
      return null;
    }

    historyEntry.bookingResult = result;
    historyEntry.status = status;
    historyEntry.completedAt = new Date();

    await this.saveHistoryEntry(historyEntry);
    this.history.set(historyId, historyEntry);

    logger.info('Updated booking result in history', {
      historyId,
      status,
      success: result.success
    });

    return historyEntry;
  }

  async getBookingHistory(filters: HistoryFilters = {}): Promise<BookingHistory[]> {
    let results = Array.from(this.history.values());

    // Apply filters
    if (filters.configurationId) {
      results = results.filter(h => h.configurationId === filters.configurationId);
    }

    if (filters.status) {
      results = results.filter(h => h.status === filters.status);
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      results = results.filter(h => h.attemptedAt >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      results = results.filter(h => h.attemptedAt <= endDate);
    }

    // Sort by attempted date (newest first)
    results.sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    
    return results.slice(offset, offset + limit);
  }

  async getHistoryEntry(historyId: string): Promise<BookingHistory | null> {
    return this.history.get(historyId) || null;
  }

  async deleteHistoryEntry(historyId: string): Promise<boolean> {
    const entry = this.history.get(historyId);
    if (!entry) {
      return false;
    }

    await this.redis.del(`history:${historyId}`);
    this.history.delete(historyId);

    logger.info('Deleted booking history entry', { historyId });
    return true;
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const allHistory = Array.from(this.history.values());
    const completedHistory = allHistory.filter(h => h.status !== 'pending');

    const totalAttempts = completedHistory.length;
    const successfulBookings = completedHistory.filter(h => h.status === 'success').length;
    const failedBookings = totalAttempts - successfulBookings;
    const successRate = totalAttempts > 0 ? (successfulBookings / totalAttempts) * 100 : 0;

    // Calculate average price
    const successfulWithPrice = completedHistory.filter(h => 
      h.status === 'success' && h.teeTime.price > 0
    );
    const averagePrice = successfulWithPrice.length > 0 ? 
      successfulWithPrice.reduce((sum, h) => sum + h.teeTime.price, 0) / successfulWithPrice.length : 0;

    // Get top courses
    const courseBookings = new Map<string, number>();
    completedHistory.forEach(h => {
      if (h.status === 'success') {
        const count = courseBookings.get(h.teeTime.courseName) || 0;
        courseBookings.set(h.teeTime.courseName, count + 1);
      }
    });

    const topCourses = Array.from(courseBookings.entries())
      .map(([courseName, bookings]) => ({ courseName, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Get recent activity (last 10 entries)
    const recentActivity = allHistory
      .sort((a, b) => b.attemptedAt.getTime() - a.attemptedAt.getTime())
      .slice(0, 10);

    return {
      totalAttempts,
      successfulBookings,
      failedBookings,
      successRate,
      averagePrice,
      topCourses,
      recentActivity
    };
  }

  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics | null> {
    const courseHistory = Array.from(this.history.values()).filter(h => 
      h.teeTime.courseName.includes(courseId) || 
      (h.teeTime as any).courseId === courseId
    );

    if (courseHistory.length === 0) {
      return null;
    }

    const courseName = courseHistory[0].teeTime.courseName;
    const completedHistory = courseHistory.filter(h => h.status !== 'pending');
    const successfulHistory = completedHistory.filter(h => h.status === 'success');

    const totalAttempts = completedHistory.length;
    const successfulBookings = successfulHistory.length;
    const successRate = totalAttempts > 0 ? (successfulBookings / totalAttempts) * 100 : 0;

    // Calculate price statistics
    const prices = successfulHistory.map(h => h.teeTime.price).filter(p => p > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, p) => sum + p, 0) / prices.length : 0;
    const priceRange = prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices)
    } : { min: 0, max: 0 };

    // Analyze preferred times
    const timeBookings = new Map<string, number>();
    successfulHistory.forEach(h => {
      const count = timeBookings.get(h.teeTime.time) || 0;
      timeBookings.set(h.teeTime.time, count + 1);
    });

    const preferredTimes = Array.from(timeBookings.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate monthly stats for the last 12 months
    const monthlyStats: Array<{ month: string; bookings: number }> = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const bookingsInMonth = successfulHistory.filter(h => {
        const historyMonth = h.attemptedAt.toISOString().substring(0, 7);
        return historyMonth === monthKey;
      }).length;

      monthlyStats.push({ month: monthName, bookings: bookingsInMonth });
    }

    return {
      courseName,
      totalAttempts,
      successfulBookings,
      successRate,
      averagePrice,
      priceRange,
      preferredTimes,
      monthlyStats
    };
  }

  async cleanupOldHistory(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const entriesToDelete = Array.from(this.history.values()).filter(h => 
      h.attemptedAt < cutoffDate
    );

    let deletedCount = 0;
    for (const entry of entriesToDelete) {
      try {
        await this.deleteHistoryEntry(entry.id);
        deletedCount++;
      } catch (error) {
        logger.error('Failed to delete old history entry', error, { historyId: entry.id });
      }
    }

    logger.info('Cleaned up old history entries', { deletedCount, cutoffDate });
    return deletedCount;
  }

  async exportHistory(filters: HistoryFilters = {}): Promise<BookingHistory[]> {
    return this.getBookingHistory({ ...filters, limit: undefined, offset: undefined });
  }

  private async saveHistoryEntry(history: BookingHistory): Promise<void> {
    try {
      await this.redis.set(`history:${history.id}`, JSON.stringify(history));
    } catch (error) {
      logger.error('Failed to save booking history to Redis', error, { historyId: history.id });
      throw error;
    }
  }

  // Get statistics for a specific configuration
  async getConfigurationStats(configurationId: string): Promise<{
    totalAttempts: number;
    successfulBookings: number;
    successRate: number;
    lastAttempt?: Date;
    lastSuccess?: Date;
  }> {
    const configHistory = Array.from(this.history.values()).filter(h => 
      h.configurationId === configurationId
    );

    const completedHistory = configHistory.filter(h => h.status !== 'pending');
    const successfulHistory = completedHistory.filter(h => h.status === 'success');

    const totalAttempts = completedHistory.length;
    const successfulBookings = successfulHistory.length;
    const successRate = totalAttempts > 0 ? (successfulBookings / totalAttempts) * 100 : 0;

    const lastAttempt = configHistory.length > 0 ? 
      Math.max(...configHistory.map(h => h.attemptedAt.getTime())) : undefined;
    const lastSuccess = successfulHistory.length > 0 ? 
      Math.max(...successfulHistory.map(h => h.attemptedAt.getTime())) : undefined;

    return {
      totalAttempts,
      successfulBookings,
      successRate,
      lastAttempt: lastAttempt ? new Date(lastAttempt) : undefined,
      lastSuccess: lastSuccess ? new Date(lastSuccess) : undefined
    };
  }
}





