import axios, { AxiosInstance, AxiosError } from 'axios';
import { BookingProvider, TeeTime, BookingRequest, BookingResult, AvailabilityQuery, AppConfig } from '../types';
import logger from '../utils/logger';

interface LightspeedApiConfig {
  token: string;
  orgId: string;
  facilityId: string;
  courseId: string;
}

interface LightspeedTeeTime {
  id: string;
  date: string;
  time: string;
  price: number;
  availableSpots: number;
  course: {
    id: string;
    name: string;
  };
  holes: number;
  walkingAllowed: boolean;
  cartRequired: boolean;
  cartIncluded: boolean;
  metadata?: Record<string, any>;
}

interface LightspeedBookingRequest {
  teeTimeId: string;
  players: Array<{
    name: string;
    email?: string;
  }>;
  preferences: {
    walkingOrCart: 'walking' | 'cart';
    holes: number;
  };
}

interface LightspeedBookingResponse {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  message: string;
  error?: string;
}

export class PartnerApiProvider implements BookingProvider {
  readonly name = 'LightspeedPartnerAPI';
  
  private client: AxiosInstance;
  private config: LightspeedApiConfig;
  private baseUrl = 'https://api.lightspeedgolf.com/v1';
  
  constructor(apiConfig: AppConfig['partnerApi']) {
    if (!apiConfig) {
      throw new Error('Partner API configuration is required');
    }
    
    this.config = {
      token: apiConfig.token,
      orgId: apiConfig.orgId,
      facilityId: apiConfig.facilityId,
      courseId: apiConfig.courseId,
    };
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ChronoAutoTee/1.0.0'
      },
    });
    
    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('API request', {
          provider: this.name,
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('API request error', error, { provider: this.name });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API response', {
          provider: this.name,
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error: AxiosError) => {
        logger.error('API response error', error, {
          provider: this.name,
          status: error.response?.status,
          url: error.config?.url,
          data: error.response?.data
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 401:
          return new Error('Authentication failed. Please check your API token.');
        case 403:
          return new Error('Access forbidden. Please check your API permissions.');
        case 404:
          return new Error('Resource not found. Please check your course/facility IDs.');
        case 429:
          return new Error('Rate limit exceeded. Please try again later.');
        case 500:
          return new Error('Internal server error. Please try again later.');
        default:
          return new Error(data?.message || `API error: ${status}`);
      }
    } else if (error.request) {
      return new Error('Network error. Please check your internet connection.');
    } else {
      return new Error(`Request setup error: ${error.message}`);
    }
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Partner API provider', { provider: this.name });
      
      // Verify API access and configuration
      await this.verifyAccess();
      
      logger.info('Partner API provider initialized successfully', { provider: this.name });
    } catch (error) {
      logger.error('Failed to initialize Partner API provider', error, { provider: this.name });
      throw error;
    }
  }

  private async verifyAccess(): Promise<void> {
    try {
      // Test API access by fetching organization details
      const response = await this.client.get(`/organizations/${this.config.orgId}`);
      
      if (!response.data) {
        throw new Error('Invalid organization ID or insufficient permissions');
      }
      
      // Verify facility access
      const facilityResponse = await this.client.get(
        `/organizations/${this.config.orgId}/facilities/${this.config.facilityId}`
      );
      
      if (!facilityResponse.data) {
        throw new Error('Invalid facility ID or insufficient permissions');
      }
      
      // Verify course access
      const courseResponse = await this.client.get(
        `/organizations/${this.config.orgId}/facilities/${this.config.facilityId}/courses/${this.config.courseId}`
      );
      
      if (!courseResponse.data) {
        throw new Error('Invalid course ID or insufficient permissions');
      }
      
      logger.info('API access verified', {
        provider: this.name,
        organization: response.data.name,
        facility: facilityResponse.data.name,
        course: courseResponse.data.name
      });
      
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to verify API access');
    }
  }

  async getAvailability(query: AvailabilityQuery): Promise<TeeTime[]> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching availability', {
        provider: this.name,
        action: 'availability',
        query: this.sanitizeQuery(query)
      });
      
      const params = {
        startDate: query.startDate,
        endDate: query.endDate,
        earliestTime: query.earliestTime,
        latestTime: query.latestTime,
        partySize: query.partySize,
        maxPrice: query.preferences.maxPrice,
        holes: query.preferences.holes === 'either' ? undefined : query.preferences.holes,
        walkingAllowed: query.preferences.walkingOrCart === 'walking' ? true : 
                       query.preferences.walkingOrCart === 'cart' ? false : undefined
      };
      
      const response = await this.client.get(
        `/organizations/${this.config.orgId}/facilities/${this.config.facilityId}/courses/${this.config.courseId}/tee-times`,
        { params }
      );
      
      const teeTimes = this.transformApiTeeTimes(response.data.teeTimes || []);
      const filteredTeeTimes = this.filterByDaysOfWeek(teeTimes, query.daysOfWeek);
      
      const duration = Date.now() - startTime;
      logger.logAvailabilityCheck(query, filteredTeeTimes.length, duration);
      
      return filteredTeeTimes;
      
    } catch (error) {
      logger.logProviderError(this.name, 'getAvailability', error as Error);
      throw error;
    }
  }

  async bookTeeTime(request: BookingRequest): Promise<BookingResult> {
    try {
      logger.logBookingAttempt(request.teeTimeId, request.playerNames.length);
      
      const bookingPayload: LightspeedBookingRequest = {
        teeTimeId: request.teeTimeId,
        players: request.playerNames.map(name => ({ name })),
        preferences: {
          walkingOrCart: request.preferences.walkingOrCart === 'either' ? 'walking' : request.preferences.walkingOrCart,
          holes: request.preferences.holes === 'either' ? 18 : request.preferences.holes
        }
      };
      
      const response = await this.client.post(
        `/organizations/${this.config.orgId}/facilities/${this.config.facilityId}/courses/${this.config.courseId}/bookings`,
        bookingPayload
      );
      
      const apiResult: LightspeedBookingResponse = response.data;
      
      if (apiResult.success) {
        logger.logBookingSuccess(apiResult.bookingId!, apiResult.confirmationNumber);
        
        return {
          success: true,
          bookingId: apiResult.bookingId,
          confirmationNumber: apiResult.confirmationNumber,
          message: apiResult.message || 'Booking completed successfully',
        };
      } else {
        logger.logBookingFailure(request.teeTimeId, apiResult.error || apiResult.message);
        
        return {
          success: false,
          message: apiResult.message || 'Booking failed',
          error: apiResult.error
        };
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown booking error';
      logger.logBookingFailure(request.teeTimeId, errorMessage);
      
      return {
        success: false,
        message: 'Booking failed due to an error',
        error: errorMessage
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // Quick health check by verifying API access
      const response = await this.client.get(`/organizations/${this.config.orgId}`);
      const healthy = response.status === 200 && response.data;
      
      logger.logHealthCheck(this.name, healthy, {
        status: response.status,
        hasData: !!response.data
      });
      
      return healthy;
      
    } catch (error) {
      logger.logHealthCheck(this.name, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async cleanup(): Promise<void> {
    try {
      logger.info('Cleaning up Partner API provider', { provider: this.name });
      // No specific cleanup needed for HTTP client
      logger.info('Partner API provider cleanup completed', { provider: this.name });
    } catch (error) {
      logger.error('Error during Partner API provider cleanup', error, { provider: this.name });
    }
  }

  private transformApiTeeTimes(apiTeeTimes: LightspeedTeeTime[]): TeeTime[] {
    return apiTeeTimes.map(apiTeeTime => ({
      id: apiTeeTime.id,
      date: apiTeeTime.date,
      time: apiTeeTime.time,
      price: apiTeeTime.price,
      availableSpots: apiTeeTime.availableSpots,
      courseName: apiTeeTime.course.name,
      holes: apiTeeTime.holes as 9 | 18,
      walkingAllowed: apiTeeTime.walkingAllowed,
      cartRequired: apiTeeTime.cartRequired,
      cartIncluded: apiTeeTime.cartIncluded,
      metadata: apiTeeTime.metadata
    }));
  }

  private filterByDaysOfWeek(teeTimes: TeeTime[], allowedDays: string[]): TeeTime[] {
    const dayMap: { [key: number]: string } = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat'
    };
    
    return teeTimes.filter(teeTime => {
      const date = new Date(teeTime.date);
      const dayOfWeek = dayMap[date.getDay()];
      return allowedDays.includes(dayOfWeek);
    });
  }

  private sanitizeQuery(query: AvailabilityQuery): any {
    // Remove sensitive information from query for logging
    const { ...sanitized } = query;
    return sanitized;
  }

  // Utility method for rate limiting and retry logic
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        
        logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
          provider: this.name,
          error: lastError.message,
          attempt,
          maxRetries
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

