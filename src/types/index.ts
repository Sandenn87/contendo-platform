export interface TeeTime {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  price: number;
  availableSpots: number;
  courseName: string;
  holes: 9 | 18;
  walkingAllowed: boolean;
  cartRequired: boolean;
  cartIncluded: boolean;
  metadata?: Record<string, any>;
}

export interface BookingRequest {
  teeTimeId: string;
  playerNames: string[];
  partySize: number;
  preferences: {
    walkingOrCart: 'walking' | 'cart' | 'either';
    holes: 9 | 18 | 'either';
  };
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  message: string;
  teeTime?: TeeTime;
  error?: string;
}

export interface AvailabilityQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  earliestTime: string; // HH:MM
  latestTime: string; // HH:MM
  partySize: number;
  daysOfWeek: DayOfWeek[];
  preferences: {
    walkingOrCart: 'walking' | 'cart' | 'either';
    holes: 9 | 18 | 'either';
    maxPrice?: number;
  };
  courseName?: string;
  courseId?: string;
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface BookingProvider {
  readonly name: string;
  
  /**
   * Initialize the provider with authentication
   */
  initialize(): Promise<void>;
  
  /**
   * Get available tee times matching the query criteria
   */
  getAvailability(query: AvailabilityQuery): Promise<TeeTime[]>;
  
  /**
   * Book a specific tee time
   */
  bookTeeTime(request: BookingRequest): Promise<BookingResult>;
  
  /**
   * Verify that the provider is properly configured and authenticated
   */
  isHealthy(): Promise<boolean>;
  
  /**
   * Clean up resources when shutting down
   */
  cleanup(): Promise<void>;
}

export interface NotificationService {
  sendSuccess(booking: BookingResult): Promise<void>;
  sendFailure(error: string, lastAttempt?: Date): Promise<void>;
  sendHealthAlert(message: string): Promise<void>;
}

export interface AppConfig {
  // Authentication
  partnerApi?: {
    token: string;
    orgId: string;
    facilityId: string;
    courseId: string;
  };
  webAuth?: {
    email: string;
    password: string;
  };
  
  // Course configuration
  homeCourse: string;
  partySize: number;
  
  // Booking window
  dateWindow: {
    start: string;
    end: string;
  };
  timeWindow: {
    earliest: string;
    latest: string;
  };
  daysOfWeek: DayOfWeek[];
  
  // Preferences
  preferences: {
    walkingOrCart: 'walking' | 'cart' | 'either';
    holes: 9 | 18 | 'either';
    maxPrice?: number;
  };
  
  // Player configuration
  playerNames: string[];
  
  // Polling configuration
  polling: {
    intervalSeconds: number;
    maxRetries: number;
    backoffMultiplier: number;
  };
  
  // Notifications
  notifications: {
    email?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      pass: string;
      to: string;
    };
    pushover?: {
      token: string;
      user: string;
    };
  };
  
  // Infrastructure
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  
  server: {
    port: number;
  };
  
  logging: {
    level: string;
    filePath: string;
  };
}

export interface JobStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastRun?: Date;
  nextRun?: Date;
  lastError?: string;
  attempts: number;
  maxAttempts: number;
}

export interface AppStatus {
  healthy: boolean;
  provider: string;
  lastCheck?: Date;
  nextCheck?: Date;
  lastBookingAttempt?: Date;
  lastSuccessfulBooking?: Date;
  currentJob?: JobStatus;
  errors: string[];
}

// Web UI specific types
export interface UserConfiguration {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface GolfCourse {
  id: string;
  name: string;
  location: string;
  timezone: string;
  teeTimeReleaseTime?: string; // When new tee times are released (e.g., "07:00")
  teeTimeReleaseDays?: number; // How many days in advance (e.g., 7)
  supportedFeatures: {
    walking: boolean;
    cart: boolean;
    holes9: boolean;
    holes18: boolean;
  };
}

export interface BookingConfiguration {
  id: string;
  userId: string;
  courseName: string;
  courseId?: string;
  
  // Authentication
  authType: 'partner_api' | 'web';
  credentials: {
    // Partner API
    partnerApiToken?: string;
    orgId?: string;
    facilityId?: string;
    courseId?: string;
    
    // Web Auth
    email?: string;
    password?: string;
  };
  
  // Booking preferences
  partySize: number;
  playerNames: string[];
  
  // Time preferences
  preferredTime: string; // Target time (e.g., "10:00")
  timeFlexibility: number; // Minutes before/after preferred time (e.g., 30)
  dateRange: {
    start: string;
    end: string;
  };
  daysOfWeek: DayOfWeek[];
  
  // Course preferences
  preferences: {
    walkingOrCart: 'walking' | 'cart' | 'either';
    holes: 9 | 18 | 'either';
    maxPrice?: number;
  };
  
  // Release timing
  teeTimeReleaseSchedule?: {
    enabled: boolean;
    releaseTime: string; // When tee times are released (e.g., "07:00")
    releaseDays: number; // Days in advance (e.g., 7)
    timezone: string;
  };
  
  // Notifications
  notifications: {
    email?: {
      enabled: boolean;
      address: string;
    };
    pushover?: {
      enabled: boolean;
      userKey: string;
      appToken: string;
    };
  };
  
  // System settings
  polling: {
    enabled: boolean;
    intervalSeconds: number;
    maxRetries: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface BookingHistory {
  id: string;
  configurationId: string;
  teeTime: TeeTime;
  bookingResult: BookingResult;
  attemptedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
}

export interface SystemSettings {
  maxConfigurations: number;
  defaultPollingInterval: number;
  maxRetries: number;
  teeTimeReleaseBuffer: number; // Minutes before release time to start checking
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
  };
}
