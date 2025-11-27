import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { BookingProvider, NotificationService, AppConfig, TeeTime, BookingRequest, AvailabilityQuery, JobStatus } from '../types';
import logger, { generateCorrelationId } from '../utils/logger';

interface BookingJobData {
  correlationId: string;
  query: AvailabilityQuery;
  playerNames: string[];
  attempt: number;
}

interface BookingJobResult {
  success: boolean;
  bookingId?: string;
  confirmationNumber?: string;
  teeTime?: TeeTime;
  message: string;
  error?: string;
}

export class BookingScheduler {
  private queue: Queue<BookingJobData, BookingJobResult>;
  private worker: Worker<BookingJobData, BookingJobResult>;
  private queueEvents: QueueEvents;
  private redis: IORedis;
  private provider: BookingProvider;
  private notificationService: NotificationService;
  private config: AppConfig;
  private isRunning = false;
  private currentJobId: string | null = null;

  constructor(
    provider: BookingProvider,
    notificationService: NotificationService,
    config: AppConfig
  ) {
    this.provider = provider;
    this.notificationService = notificationService;
    this.config = config;

    // Create Redis connection
    this.redis = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    // Create queue
    this.queue = new Queue<BookingJobData, BookingJobResult>('booking-queue', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 100,    // Keep last 100 failed jobs
        attempts: config.polling.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
      },
    });

    // Create worker
    this.worker = new Worker<BookingJobData, BookingJobResult>(
      'booking-queue',
      this.processBookingJob.bind(this),
      {
        connection: this.redis,
        concurrency: 1, // Process one job at a time
        stalledInterval: 30000,
        maxStalledCount: 1,
      }
    );

    // Create queue events listener
    this.queueEvents = new QueueEvents('booking-queue', {
      connection: this.redis,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Worker events
    this.worker.on('completed', (job: Job<BookingJobData, BookingJobResult>) => {
      logger.logSchedulerEvent('job_completed', {
        jobId: job.id,
        correlationId: job.data.correlationId,
        result: job.returnvalue
      });
      this.currentJobId = null;
    });

    this.worker.on('failed', (job: Job<BookingJobData> | undefined, error: Error) => {
      logger.logSchedulerEvent('job_failed', {
        jobId: job?.id,
        correlationId: job?.data.correlationId,
        error: error.message,
        attempt: job?.attemptsMade || 0,
        maxAttempts: job?.opts.attempts || 0
      });
      this.currentJobId = null;
    });

    this.worker.on('stalled', (jobId: string) => {
      logger.warn('Job stalled', { jobId, provider: this.provider.name });
    });

    this.worker.on('error', (error: Error) => {
      logger.error('Worker error', error, { provider: this.provider.name });
    });

    // Queue events
    this.queueEvents.on('waiting', ({ jobId }) => {
      logger.debug('Job waiting', { jobId });
    });

    this.queueEvents.on('active', ({ jobId }) => {
      logger.debug('Job active', { jobId });
      this.currentJobId = jobId;
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug('Job progress', { jobId, progress: data });
    });

    // Redis connection events
    this.redis.on('connect', () => {
      logger.info('Redis connected', { host: this.config.redis.host });
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error', error);
    });

    this.redis.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting booking scheduler', {
        provider: this.provider.name,
        interval: this.config.polling.intervalSeconds
      });

      // Connect to Redis
      await this.redis.connect();

      // Clear any existing recurring job
      await this.queue.obliterate({ force: true });

      // Add recurring job with jitter
      const intervalWithJitter = this.addJitter(this.config.polling.intervalSeconds * 1000);
      
      await this.queue.add(
        'check-availability',
        this.createJobData(),
        {
          repeat: { every: intervalWithJitter },
          jobId: 'recurring-booking-check', // Prevents duplicates
        }
      );

      this.isRunning = true;
      logger.logSchedulerEvent('start', {
        provider: this.provider.name,
        intervalMs: intervalWithJitter
      });

    } catch (error) {
      logger.error('Failed to start scheduler', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Stopping booking scheduler');

      this.isRunning = false;

      // Close worker (waits for current job to complete)
      await this.worker.close();

      // Close queue events
      await this.queueEvents.close();

      // Close queue
      await this.queue.close();

      // Close Redis connection
      await this.redis.quit();

      logger.logSchedulerEvent('stop');

    } catch (error) {
      logger.error('Error stopping scheduler', error);
      throw error;
    }
  }

  async getStatus(): Promise<JobStatus> {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();

      const currentJob = active[0] || waiting[0];
      const lastJob = completed[0] || failed[0];

      return {
        id: currentJob?.id || 'none',
        status: currentJob ? 'running' : waiting.length > 0 ? 'pending' : 'completed',
        lastRun: lastJob ? new Date(lastJob.timestamp) : undefined,
        nextRun: currentJob ? undefined : this.getNextRunTime(),
        lastError: failed[0]?.failedReason,
        attempts: currentJob?.attemptsMade || 0,
        maxAttempts: this.config.polling.maxRetries
      };

    } catch (error) {
      logger.error('Failed to get scheduler status', error);
      throw error;
    }
  }

  private async processBookingJob(job: Job<BookingJobData>): Promise<BookingJobResult> {
    const { correlationId, query, playerNames, attempt } = job.data;

    // Set correlation ID for logging
    logger.setCorrelationId(correlationId);

    try {
      logger.info('Processing booking job', {
        jobId: job.id,
        attempt,
        maxAttempts: job.opts.attempts
      });

      // Update job progress
      await job.updateProgress(10);

      // Check provider health
      const isHealthy = await this.provider.isHealthy();
      if (!isHealthy) {
        throw new Error(`Provider ${this.provider.name} is not healthy`);
      }

      await job.updateProgress(20);

      // Get availability
      logger.info('Checking availability', { query: this.sanitizeQuery(query) });
      const availableTeeTimes = await this.provider.getAvailability(query);

      await job.updateProgress(50);

      if (availableTeeTimes.length === 0) {
        logger.info('No tee times available', { query: this.sanitizeQuery(query) });
        
        // Schedule next check with jitter
        await this.scheduleNextCheck();
        
        return {
          success: false,
          message: 'No tee times available in the specified window'
        };
      }

      // Sort by date and time to get the earliest available slot
      const sortedTeeTimes = availableTeeTimes.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      const selectedTeeTime = sortedTeeTimes[0];
      
      logger.info('Found available tee time', {
        teeTimeId: selectedTeeTime.id,
        date: selectedTeeTime.date,
        time: selectedTeeTime.time,
        price: selectedTeeTime.price
      });

      await job.updateProgress(70);

      // Book the tee time
      const bookingRequest: BookingRequest = {
        teeTimeId: selectedTeeTime.id,
        playerNames,
        partySize: query.partySize,
        preferences: query.preferences
      };

      const bookingResult = await this.provider.bookTeeTime(bookingRequest);

      await job.updateProgress(90);

      if (bookingResult.success) {
        // Send success notification
        await this.notificationService.sendSuccess({
          ...bookingResult,
          teeTime: selectedTeeTime
        });

        await job.updateProgress(100);

        return {
          success: true,
          bookingId: bookingResult.bookingId,
          confirmationNumber: bookingResult.confirmationNumber,
          teeTime: selectedTeeTime,
          message: bookingResult.message
        };
      } else {
        // Booking failed, but we found availability
        throw new Error(bookingResult.error || bookingResult.message);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Booking job failed', error, {
        jobId: job.id,
        attempt,
        maxAttempts: job.opts.attempts
      });

      // Check if this is the final attempt
      const isFinalAttempt = attempt >= (job.opts.attempts || this.config.polling.maxRetries);
      
      if (isFinalAttempt) {
        // Send failure notification on final attempt
        await this.notificationService.sendFailure(errorMessage, new Date());
      }

      // Re-throw error for BullMQ to handle retries
      throw error;

    } finally {
      logger.clearCorrelationId();
    }
  }

  private createJobData(): BookingJobData {
    const query: AvailabilityQuery = {
      startDate: this.config.dateWindow.start,
      endDate: this.config.dateWindow.end,
      earliestTime: this.config.timeWindow.earliest,
      latestTime: this.config.timeWindow.latest,
      partySize: this.config.partySize,
      daysOfWeek: this.config.daysOfWeek,
      preferences: this.config.preferences,
      courseName: this.config.homeCourse
    };

    return {
      correlationId: generateCorrelationId(),
      query,
      playerNames: this.config.playerNames,
      attempt: 1
    };
  }

  private async scheduleNextCheck(): Promise<void> {
    if (!this.isRunning) return;

    const intervalWithJitter = this.addJitter(this.config.polling.intervalSeconds * 1000);
    
    await this.queue.add(
      'check-availability',
      this.createJobData(),
      {
        delay: intervalWithJitter,
        jobId: `check-${Date.now()}`, // Unique ID for each scheduled check
      }
    );

    logger.debug('Scheduled next check', { delayMs: intervalWithJitter });
  }

  private addJitter(intervalMs: number): number {
    // Add ±20% jitter to prevent thundering herd
    const jitterRange = intervalMs * 0.2;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(1000, Math.floor(intervalMs + jitter)); // Minimum 1 second
  }

  private getNextRunTime(): Date | undefined {
    if (!this.isRunning) return undefined;
    
    const intervalMs = this.addJitter(this.config.polling.intervalSeconds * 1000);
    return new Date(Date.now() + intervalMs);
  }

  private sanitizeQuery(query: AvailabilityQuery): any {
    // Remove sensitive data for logging
    const sanitized = { ...query };
    // Add any sanitization logic here
    return sanitized;
  }

  // Manual trigger for testing or immediate booking attempts
  async triggerImmediateCheck(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Scheduler is not running');
    }

    await this.queue.add(
      'immediate-check',
      this.createJobData(),
      {
        priority: 10, // High priority
        jobId: `immediate-${Date.now()}`
      }
    );

    logger.info('Triggered immediate availability check');
  }

  // Pause/resume functionality
  async pause(): Promise<void> {
    await this.worker.pause();
    logger.info('Scheduler paused');
  }

  async resume(): Promise<void> {
    await this.worker.resume();
    logger.info('Scheduler resumed');
  }

  // Get queue metrics
  async getMetrics(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  // Clean up old jobs
  async cleanupOldJobs(): Promise<void> {
    try {
      await this.queue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean completed jobs older than 24h
      await this.queue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed');   // Clean failed jobs older than 7 days
      logger.info('Cleaned up old jobs');
    } catch (error) {
      logger.error('Failed to clean up old jobs', error);
    }
  }
}
