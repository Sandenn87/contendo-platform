import IORedis from 'ioredis';
import { GolfCourse } from '../types';
import { PartnerApiProvider } from '../providers/partner-api';
import { WebProvider } from '../providers/web-provider';
import logger from '../utils/logger';

interface AuthData {
  type: 'partner_api' | 'web';
  email?: string;
  password?: string;
  token?: string;
  orgId?: string;
  facilityId?: string;
}

export class CourseDiscoveryService {
  private redis: IORedis;
  private courseCache: Map<string, GolfCourse> = new Map();

  constructor(redis: IORedis) {
    this.redis = redis;
    this.loadCachedCourses();
  }

  private async loadCachedCourses(): Promise<void> {
    try {
      const keys = await this.redis.keys('course:*');
      
      for (const key of keys) {
        const courseData = await this.redis.get(key);
        if (courseData) {
          const course = JSON.parse(courseData) as GolfCourse;
          this.courseCache.set(course.id, course);
        }
      }

      logger.info('Loaded cached courses', { count: this.courseCache.size });
    } catch (error) {
      logger.error('Failed to load cached courses', error);
    }
  }

  async getCachedCourses(): Promise<GolfCourse[]> {
    return Array.from(this.courseCache.values());
  }

  async searchCourses(query: string, authData: AuthData): Promise<GolfCourse[]> {
    try {
      logger.info('Searching for courses', { query, authType: authData.type });

      let courses: GolfCourse[] = [];

      if (authData.type === 'partner_api' && authData.token && authData.orgId && authData.facilityId) {
        courses = await this.searchCoursesViaApi(query, authData);
      } else if (authData.type === 'web' && authData.email && authData.password) {
        courses = await this.searchCoursesViaWeb(query, authData);
      } else {
        throw new Error('Invalid authentication data provided');
      }

      // Cache discovered courses
      for (const course of courses) {
        await this.cacheCourse(course);
      }

      logger.info('Course search completed', { query, found: courses.length });
      return courses;

    } catch (error) {
      logger.error('Course search failed', error, { query, authType: authData.type });
      throw error;
    }
  }

  private async searchCoursesViaApi(query: string, authData: AuthData): Promise<GolfCourse[]> {
    try {
      // Create temporary provider for search
      const provider = new PartnerApiProvider({
        token: authData.token!,
        orgId: authData.orgId!,
        facilityId: authData.facilityId!,
        courseId: '' // Not needed for search
      });

      await provider.initialize();

      // In a real implementation, you'd call the API to search for courses
      // For now, we'll simulate this
      const mockCourses: GolfCourse[] = [
        {
          id: 'course-1',
          name: `${query} Golf Club`,
          location: 'Sample Location',
          timezone: 'America/New_York',
          teeTimeReleaseTime: '07:00',
          teeTimeReleaseDays: 7,
          supportedFeatures: {
            walking: true,
            cart: true,
            holes9: true,
            holes18: true
          }
        }
      ];

      await provider.cleanup();
      return mockCourses;

    } catch (error) {
      logger.error('API course search failed', error);
      throw new Error('Failed to search courses via Partner API');
    }
  }

  private async searchCoursesViaWeb(query: string, authData: AuthData): Promise<GolfCourse[]> {
    let provider: WebProvider | null = null;
    
    try {
      provider = new WebProvider(
        { email: authData.email!, password: authData.password! },
        query
      );

      await provider.initialize();

      // Simulate course search via web scraping
      // In a real implementation, this would navigate to Chronogolf and search
      const mockCourses: GolfCourse[] = [
        {
          id: 'web-course-1',
          name: `${query} Country Club`,
          location: 'Web Location',
          timezone: 'America/New_York',
          teeTimeReleaseTime: '08:00',
          teeTimeReleaseDays: 14,
          supportedFeatures: {
            walking: true,
            cart: true,
            holes9: false,
            holes18: true
          }
        }
      ];

      return mockCourses;

    } catch (error) {
      logger.error('Web course search failed', error);
      throw new Error('Failed to search courses via web automation');
    } finally {
      if (provider) {
        await provider.cleanup();
      }
    }
  }

  async testAuthentication(authData: AuthData): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Testing authentication', { authType: authData.type });

      if (authData.type === 'partner_api') {
        return await this.testApiAuthentication(authData);
      } else {
        return await this.testWebAuthentication(authData);
      }

    } catch (error) {
      logger.error('Authentication test failed', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Authentication test failed'
      };
    }
  }

  private async testApiAuthentication(authData: AuthData): Promise<{ success: boolean; message: string }> {
    if (!authData.token || !authData.orgId || !authData.facilityId) {
      return {
        success: false,
        message: 'Missing required API credentials'
      };
    }

    try {
      const provider = new PartnerApiProvider({
        token: authData.token,
        orgId: authData.orgId,
        facilityId: authData.facilityId,
        courseId: '' // Not needed for auth test
      });

      await provider.initialize();
      const healthy = await provider.isHealthy();
      await provider.cleanup();

      return {
        success: healthy,
        message: healthy ? 'Partner API authentication successful' : 'Partner API authentication failed'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Partner API test failed'
      };
    }
  }

  private async testWebAuthentication(authData: AuthData): Promise<{ success: boolean; message: string }> {
    if (!authData.email || !authData.password) {
      return {
        success: false,
        message: 'Missing email or password'
      };
    }

    let provider: WebProvider | null = null;
    
    try {
      provider = new WebProvider(
        { email: authData.email, password: authData.password },
        'test'
      );

      await provider.initialize();
      const healthy = await provider.isHealthy();

      return {
        success: healthy,
        message: healthy ? 'Web authentication successful' : 'Web authentication failed'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Web authentication test failed'
      };
    } finally {
      if (provider) {
        await provider.cleanup();
      }
    }
  }

  private async cacheCourse(course: GolfCourse): Promise<void> {
    try {
      await this.redis.setex(`course:${course.id}`, 3600 * 24, JSON.stringify(course)); // Cache for 24 hours
      this.courseCache.set(course.id, course);
    } catch (error) {
      logger.error('Failed to cache course', error, { courseId: course.id });
    }
  }

  async getCourse(courseId: string): Promise<GolfCourse | null> {
    return this.courseCache.get(courseId) || null;
  }

  async clearCourseCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('course:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      this.courseCache.clear();
      logger.info('Cleared course cache');
    } catch (error) {
      logger.error('Failed to clear course cache', error);
    }
  }

  // Extract course information from tee time data
  async extractCourseFromTeeTime(courseName: string, teeTimeData?: any): Promise<GolfCourse> {
    // Check if we already have this course
    const existing = Array.from(this.courseCache.values()).find(c => c.name === courseName);
    if (existing) {
      return existing;
    }

    // Create a new course entry
    const course: GolfCourse = {
      id: `discovered-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: courseName,
      location: 'Unknown Location',
      timezone: 'America/New_York', // Default timezone
      supportedFeatures: {
        walking: true,
        cart: true,
        holes9: true,
        holes18: true
      }
    };

    // Try to extract more details from tee time data if available
    if (teeTimeData) {
      // This would analyze the tee time data to determine course features
      course.supportedFeatures.walking = teeTimeData.walkingAllowed !== false;
      course.supportedFeatures.cart = teeTimeData.cartRequired === true || teeTimeData.cartIncluded === true;
      course.supportedFeatures.holes9 = teeTimeData.holes === 9;
      course.supportedFeatures.holes18 = teeTimeData.holes === 18;
    }

    // Cache the discovered course
    await this.cacheCourse(course);

    return course;
  }

  // Get course statistics
  async getCourseStatistics(): Promise<{
    total: number;
    byLocation: Record<string, number>;
    byFeatures: {
      walking: number;
      cart: number;
      holes9: number;
      holes18: number;
    };
  }> {
    const courses = Array.from(this.courseCache.values());
    
    const stats = {
      total: courses.length,
      byLocation: {} as Record<string, number>,
      byFeatures: {
        walking: 0,
        cart: 0,
        holes9: 0,
        holes18: 0
      }
    };

    courses.forEach(course => {
      // Count by location
      stats.byLocation[course.location] = (stats.byLocation[course.location] || 0) + 1;

      // Count by features
      if (course.supportedFeatures.walking) stats.byFeatures.walking++;
      if (course.supportedFeatures.cart) stats.byFeatures.cart++;
      if (course.supportedFeatures.holes9) stats.byFeatures.holes9++;
      if (course.supportedFeatures.holes18) stats.byFeatures.holes18++;
    });

    return stats;
  }
}





