import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { BookingProvider, TeeTime, BookingRequest, BookingResult, AvailabilityQuery, AppConfig, DayOfWeek } from '../types';
import logger from '../utils/logger';

interface WebAuthConfig {
  email: string;
  password: string;
}

interface ChronogolfSelectors {
  // Login page
  emailInput: string;
  passwordInput: string;
  loginButton: string;
  twoFactorInput?: string;
  twoFactorSubmit?: string;
  
  // Course search
  courseSearch: string;
  courseResult: string;
  
  // Date/time selection
  dateInput: string;
  timeSlot: string;
  partySizeSelect: string;
  
  // Tee time details
  teeTimeCard: string;
  teeTimeTime: string;
  teeTimePrice: string;
  teeTimeHoles: string;
  walkingOption: string;
  cartOption: string;
  bookButton: string;
  
  // Booking form
  playerNameInput: string;
  confirmBooking: string;
  
  // Confirmation
  confirmationNumber: string;
  confirmationMessage: string;
}

export class WebProvider implements BookingProvider {
  readonly name = 'ChronogolfWeb';
  
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: WebAuthConfig;
  private homeCourse: string;
  private isAuthenticated = false;
  
  private selectors: ChronogolfSelectors = {
    // Login selectors
    emailInput: 'input[type="email"], input[name="email"], #email',
    passwordInput: 'input[type="password"], input[name="password"], #password',
    loginButton: 'button[type="submit"], input[type="submit"], .login-btn, #login-btn',
    twoFactorInput: 'input[name="code"], input[placeholder*="code"], .two-factor-input',
    twoFactorSubmit: 'button[type="submit"], .verify-btn, .submit-code',
    
    // Course search
    courseSearch: 'input[placeholder*="course"], .course-search, #course-search',
    courseResult: '.course-result, .course-item, .search-result',
    
    // Date/time selection
    dateInput: 'input[type="date"], .date-picker, #date-input',
    timeSlot: '.time-slot, .tee-time, .available-time',
    partySizeSelect: 'select[name*="party"], .party-size-select, #party-size',
    
    // Tee time details
    teeTimeCard: '.tee-time-card, .booking-slot, .time-slot-card',
    teeTimeTime: '.time, .tee-time, .slot-time',
    teeTimePrice: '.price, .cost, .amount',
    teeTimeHoles: '.holes, .course-type, .round-type',
    walkingOption: 'input[value*="walk"], .walking-option, #walking',
    cartOption: 'input[value*="cart"], .cart-option, #cart',
    bookButton: '.book-btn, .reserve-btn, .select-btn, button[data-action="book"]',
    
    // Booking form
    playerNameInput: 'input[name*="player"], .player-name, .golfer-name',
    confirmBooking: '.confirm-booking, .complete-booking, .finalize-btn',
    
    // Confirmation
    confirmationNumber: '.confirmation-number, .booking-reference, .confirmation-code',
    confirmationMessage: '.success-message, .confirmation-message, .booking-success'
  };

  constructor(webConfig: AppConfig['webAuth'], homeCourse: string) {
    if (!webConfig) {
      throw new Error('Web authentication configuration is required');
    }
    
    this.config = {
      email: webConfig.email,
      password: webConfig.password,
    };
    this.homeCourse = homeCourse;
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Web provider', { provider: this.name });
      
      // Launch browser with stealth settings
      this.browser = await chromium.launch({
        headless: process.env.NODE_ENV === 'production',
        slowMo: 100, // Add slight delay between actions
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      // Create persistent context with realistic user agent
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1366, height: 768 },
        locale: 'en-US',
        timezoneId: 'America/New_York'
      });
      
      this.page = await this.context.newPage();
      
      // Add random delays and human-like behavior
      await this.page.addInitScript(() => {
        // Override webdriver detection
        Object.defineProperty((globalThis as any).navigator, 'webdriver', { get: () => undefined });
      });
      
      await this.login();
      
      logger.info('Web provider initialized successfully', { provider: this.name });
    } catch (error) {
      logger.error('Failed to initialize Web provider', error, { provider: this.name });
      await this.cleanup();
      throw error;
    }
  }

  private async login(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      logger.info('Logging into Chronogolf', { provider: this.name });
      
      // Navigate to login page
      await this.page.goto('https://www.chronogolf.com/login', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for and fill email
      await this.page.waitForSelector(this.selectors.emailInput, { timeout: 10000 });
      await this.page.fill(this.selectors.emailInput, this.config.email);
      await this.humanDelay();
      
      // Fill password
      await this.page.fill(this.selectors.passwordInput, this.config.password);
      await this.humanDelay();
      
      // Click login button
      await this.page.click(this.selectors.loginButton);
      
      // Wait for navigation or 2FA
      try {
        await this.page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Check if 2FA is required
        if (this.selectors.twoFactorInput) {
          const twoFactorInput = await this.page.$(this.selectors.twoFactorInput);
          if (twoFactorInput) {
            await this.handle2FA();
          }
        }
        
        // Verify login success
        const currentUrl = this.page.url();
        if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
          throw new Error('Login failed - still on login page');
        }
        
        this.isAuthenticated = true;
        logger.info('Successfully logged into Chronogolf', { provider: this.name });
        
      } catch (error) {
        throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
    } catch (error) {
      logger.error('Login failed', error, { provider: this.name });
      throw error;
    }
  }

  private async handle2FA(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    logger.warn('2FA required - manual intervention needed', { provider: this.name });
    
    // Wait for 2FA code input to be visible
    if (this.selectors.twoFactorInput) {
      await this.page.waitForSelector(this.selectors.twoFactorInput, { timeout: 10000 });
    }
    
    console.log('\n🔐 Two-Factor Authentication Required');
    console.log('Please check your email/SMS for the verification code.');
    console.log('The application will wait for 2 minutes for you to enter the code manually.');
    console.log('Switch to the browser window and enter the code...\n');
    
    // Wait for 2 minutes for manual code entry
    try {
      await this.page.waitForNavigation({ 
        timeout: 120000, // 2 minutes
        waitUntil: 'networkidle' 
      });
      logger.info('2FA completed successfully', { provider: this.name });
    } catch (error) {
      throw new Error('2FA timeout - please ensure you complete 2FA within 2 minutes');
    }
  }

  async getAvailability(query: AvailabilityQuery): Promise<TeeTime[]> {
    if (!this.page || !this.isAuthenticated) {
      throw new Error('Web provider not initialized or not authenticated');
    }
    
    const startTime = Date.now();
    
    try {
      logger.info('Fetching availability via web', {
        provider: this.name,
        action: 'availability',
        course: this.homeCourse,
        dateRange: `${query.startDate} to ${query.endDate}`
      });
      
      const teeTimes: TeeTime[] = [];
      
      // Navigate to course booking page
      await this.navigateToCourse();
      
      // Iterate through date range
      const startDate = new Date(query.startDate);
      const endDate = new Date(query.endDate);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = this.getDayOfWeek(date);
        
        if (!query.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }
        
        try {
          const dayTeeTimes = await this.getAvailabilityForDate(dateStr, query);
          teeTimes.push(...dayTeeTimes);
          
          // Add delay between requests to avoid rate limiting
          await this.humanDelay(2000, 4000);
        } catch (error) {
          logger.warn(`Failed to get availability for ${dateStr}`, {
            provider: this.name,
            date: dateStr,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const duration = Date.now() - startTime;
      logger.logAvailabilityCheck(query, teeTimes.length, duration);
      
      return teeTimes;
      
    } catch (error) {
      logger.logProviderError(this.name, 'getAvailability', error as Error);
      throw error;
    }
  }

  private async navigateToCourse(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      // Navigate to course search
      await this.page.goto('https://www.chronogolf.com/search', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Search for home course
      await this.page.waitForSelector(this.selectors.courseSearch, { timeout: 10000 });
      await this.page.fill(this.selectors.courseSearch, this.homeCourse);
      await this.humanDelay();
      
      // Wait for search results and click first result
      await this.page.waitForSelector(this.selectors.courseResult, { timeout: 10000 });
      await this.page.click(this.selectors.courseResult);
      
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });
      
    } catch (error) {
      throw new Error(`Failed to navigate to course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getAvailabilityForDate(date: string, query: AvailabilityQuery): Promise<TeeTime[]> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      // Set date
      await this.page.waitForSelector(this.selectors.dateInput, { timeout: 10000 });
      await this.page.fill(this.selectors.dateInput, date);
      await this.humanDelay();
      
      // Set party size
      try {
        await this.page.selectOption(this.selectors.partySizeSelect, query.partySize.toString());
        await this.humanDelay();
      } catch (error) {
        logger.debug('Party size selector not found or failed', { provider: this.name });
      }
      
      // Wait for tee times to load
      await this.page.waitForSelector(this.selectors.teeTimeCard, { timeout: 10000 });
      
      // Extract tee time information
      const teeTimeElements = await this.page.$$(this.selectors.teeTimeCard);
      const teeTimes: TeeTime[] = [];
      
      for (const element of teeTimeElements) {
        try {
          const teeTime = await this.extractTeeTimeFromElement(element, date);
          
          if (this.isValidTeeTime(teeTime, query)) {
            teeTimes.push(teeTime);
          }
        } catch (error) {
          logger.debug('Failed to extract tee time from element', {
            provider: this.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      return teeTimes;
      
    } catch (error) {
      logger.warn(`No availability found for ${date}`, {
        provider: this.name,
        date,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private async extractTeeTimeFromElement(element: any, date: string): Promise<TeeTime> {
    const timeText = await element.$eval(this.selectors.teeTimeTime, (el: any) => el.textContent?.trim() || '');
    const priceText = await element.$eval(this.selectors.teeTimePrice, (el: any) => el.textContent?.trim() || '0');
    const holesText = await element.$eval(this.selectors.teeTimeHoles, (el: any) => el.textContent?.trim() || '18').catch(() => '18');
    
    // Extract ID from element attributes
    const id = await element.getAttribute('data-id') || 
               await element.getAttribute('id') || 
               `${date}-${timeText.replace(':', '')}`;
    
    // Parse price
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    
    // Parse holes
    const holes = holesText.includes('9') ? 9 : 18;
    
    // Check walking/cart options
    const walkingAllowed = await element.$(this.selectors.walkingOption).then((el: any) => !!el).catch(() => true);
    const cartRequired = await element.$(this.selectors.cartOption).then(async (el: any) => {
      if (!el) return false;
      const text = await el.textContent();
      return text?.toLowerCase().includes('required') || false;
    }).catch(() => false);
    
    return {
      id,
      date,
      time: timeText,
      price,
      availableSpots: 4, // Default assumption
      courseName: this.homeCourse,
      holes: holes as 9 | 18,
      walkingAllowed,
      cartRequired,
      cartIncluded: false
    };
  }

  private isValidTeeTime(teeTime: TeeTime, query: AvailabilityQuery): boolean {
    // Check time range
    const timeMinutes = this.timeToMinutes(teeTime.time);
    const earliestMinutes = this.timeToMinutes(query.earliestTime);
    const latestMinutes = this.timeToMinutes(query.latestTime);
    
    if (timeMinutes < earliestMinutes || timeMinutes > latestMinutes) {
      return false;
    }
    
    // Check price
    if (query.preferences.maxPrice && teeTime.price > query.preferences.maxPrice) {
      return false;
    }
    
    // Check holes preference
    if (query.preferences.holes !== 'either' && teeTime.holes !== query.preferences.holes) {
      return false;
    }
    
    // Check walking/cart preference
    if (query.preferences.walkingOrCart === 'walking' && !teeTime.walkingAllowed) {
      return false;
    }
    if (query.preferences.walkingOrCart === 'cart' && !teeTime.cartRequired && !teeTime.cartIncluded) {
      return false;
    }
    
    return true;
  }

  async bookTeeTime(request: BookingRequest): Promise<BookingResult> {
    if (!this.page || !this.isAuthenticated) {
      throw new Error('Web provider not initialized or not authenticated');
    }
    
    try {
      logger.logBookingAttempt(request.teeTimeId, request.playerNames.length);
      
      // Find and click the book button for the specific tee time
      const teeTimeElement = await this.page.$(`[data-id="${request.teeTimeId}"]`) ||
                            await this.page.$(`#${request.teeTimeId}`);
      
      if (!teeTimeElement) {
        throw new Error(`Tee time ${request.teeTimeId} not found on page`);
      }
      
      // Click book button
      const bookButton = await teeTimeElement.$(this.selectors.bookButton);
      if (!bookButton) {
        throw new Error('Book button not found for tee time');
      }
      
      await bookButton.click();
      await this.humanDelay();
      
      // Fill in player information
      await this.fillPlayerInformation(request.playerNames);
      
      // Select preferences
      await this.selectBookingPreferences(request.preferences);
      
      // Confirm booking
      await this.page.waitForSelector(this.selectors.confirmBooking, { timeout: 10000 });
      await this.page.click(this.selectors.confirmBooking);
      
      // Wait for confirmation
      await this.page.waitForLoadState('networkidle', { timeout: 30000 });
      
      // Extract confirmation details
      const confirmationNumber = await this.page.$eval(
        this.selectors.confirmationNumber,
        (el: any) => el.textContent?.trim()
      ).catch(() => null);
      
      const confirmationMessage = await this.page.$eval(
        this.selectors.confirmationMessage,
        (el: any) => el.textContent?.trim()
      ).catch(() => 'Booking completed');
      
      if (confirmationNumber || confirmationMessage.toLowerCase().includes('success')) {
        logger.logBookingSuccess(request.teeTimeId, confirmationNumber || undefined);
        
        return {
          success: true,
          bookingId: request.teeTimeId,
          confirmationNumber: confirmationNumber || undefined,
          message: confirmationMessage || 'Booking completed successfully'
        };
      } else {
        throw new Error('Booking confirmation not found');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown booking error';
      logger.logBookingFailure(request.teeTimeId, errorMessage);
      
      return {
        success: false,
        message: 'Booking failed',
        error: errorMessage
      };
    }
  }

  private async fillPlayerInformation(playerNames: string[]): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    const playerInputs = await this.page.$$(this.selectors.playerNameInput);
    
    for (let i = 0; i < Math.min(playerNames.length, playerInputs.length); i++) {
      await playerInputs[i].fill(playerNames[i]);
      await this.humanDelay(500, 1500);
    }
  }

  private async selectBookingPreferences(preferences: any): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    try {
      // Select walking/cart preference
      if (preferences.walkingOrCart === 'walking') {
        const walkingOption = await this.page.$(this.selectors.walkingOption);
        if (walkingOption) {
          await walkingOption.click();
          await this.humanDelay();
        }
      } else if (preferences.walkingOrCart === 'cart') {
        const cartOption = await this.page.$(this.selectors.cartOption);
        if (cartOption) {
          await cartOption.click();
          await this.humanDelay();
        }
      }
    } catch (error) {
      logger.debug('Failed to select booking preferences', {
        provider: this.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.browser || !this.page) {
        return false;
      }
      
      // Check if browser is still running
      const contexts = this.browser.contexts();
      const healthy = contexts.length > 0 && this.isAuthenticated;
      
      logger.logHealthCheck(this.name, healthy, {
        browserRunning: !!this.browser,
        pageExists: !!this.page,
        authenticated: this.isAuthenticated
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
      logger.info('Cleaning up Web provider', { provider: this.name });
      
      if (this.page) {
        await this.page.close().catch(() => {});
        this.page = null;
      }
      
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
      }
      
      if (this.browser) {
        await this.browser.close().catch(() => {});
        this.browser = null;
      }
      
      this.isAuthenticated = false;
      
      logger.info('Web provider cleanup completed', { provider: this.name });
    } catch (error) {
      logger.error('Error during Web provider cleanup', error, { provider: this.name });
    }
  }

  // Utility methods
  private async humanDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }
}
