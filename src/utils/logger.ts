import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { getConfig } from '../config';

interface LogContext {
  correlationId?: string;
  provider?: string;
  action?: string;
  teeTimeId?: string;
  bookingId?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private logger: winston.Logger;
  private correlationId: string | null = null;

  constructor() {
    const config = getConfig();
    
    // Ensure log directory exists
    if (!fs.existsSync(config.logging.filePath)) {
      fs.mkdirSync(config.logging.filePath, { recursive: true });
    }

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const logEntry: any = {
          timestamp,
          level,
          message,
          ...(this.correlationId && { correlationId: this.correlationId }),
          ...meta
        };
        if (stack) {
          logEntry.stack = stack;
        }
        return JSON.stringify(logEntry);
      })
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        const correlation = correlationId ? `[${correlationId}] ` : '';
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} ${level}: ${correlation}${message}${metaStr}`;
      })
    );

    // Create transports
    const transports: winston.transport[] = [
      // Console transport
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: consoleFormat,
        silent: process.env.NODE_ENV === 'test'
      }),

      // Application log file (rotating)
      new DailyRotateFile({
        filename: path.join(config.logging.filePath, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        level: config.logging.level,
        format: logFormat
      }),

      // Error log file (rotating)
      new DailyRotateFile({
        filename: path.join(config.logging.filePath, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: logFormat
      }),

      // Booking-specific log file (rotating)
      new DailyRotateFile({
        filename: path.join(config.logging.filePath, 'booking-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '90d',
        level: 'info',
        format: logFormat
      })
    ];

    this.logger = winston.createLogger({
      level: config.logging.level,
      format: logFormat,
      transports,
      exceptionHandlers: [
        new winston.transports.File({ 
          filename: path.join(config.logging.filePath, 'exceptions.log'),
          format: logFormat
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({ 
          filename: path.join(config.logging.filePath, 'rejections.log'),
          format: logFormat
        })
      ]
    });
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  clearCorrelationId(): void {
    this.correlationId = null;
  }

  private log(level: string, message: string, context?: LogContext): void {
    this.logger.log(level, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      ...context
    } : {
      error: String(error),
      ...context
    };
    this.log('error', message, errorContext);
  }

  // Specialized logging methods for different operations
  logAvailabilityCheck(query: any, results: number, duration: number): void {
    this.info('Availability check completed', {
      action: 'availability',
      query: this.sanitizeQuery(query),
      resultsCount: results,
      durationMs: duration
    });
  }

  logBookingAttempt(teeTimeId: string, playerCount: number): void {
    this.info('Booking attempt started', {
      action: 'booking',
      teeTimeId,
      playerCount
    });
  }

  logBookingSuccess(bookingId: string, confirmationNumber?: string): void {
    this.info('Booking successful', {
      action: 'booking',
      bookingId,
      confirmationNumber,
      result: 'success'
    });
  }

  logBookingFailure(teeTimeId: string, reason: string): void {
    this.error('Booking failed', new Error(reason), {
      action: 'booking',
      teeTimeId,
      result: 'failure'
    });
  }

  logNotificationSent(type: 'email' | 'pushover', recipient: string, subject?: string): void {
    this.info('Notification sent', {
      action: 'notification',
      type,
      recipient: this.sanitizeEmail(recipient),
      subject
    });
  }

  logProviderError(provider: string, operation: string, error: Error): void {
    this.error(`Provider error during ${operation}`, error, {
      provider,
      operation
    });
  }

  logSchedulerEvent(event: 'start' | 'stop' | 'job_added' | 'job_completed' | 'job_failed', details?: any): void {
    this.info(`Scheduler event: ${event}`, {
      action: 'scheduler',
      event,
      ...details
    });
  }

  logHealthCheck(provider: string, healthy: boolean, details?: any): void {
    const level = healthy ? 'info' : 'warn';
    this.log(level, `Health check: ${provider}`, {
      action: 'health_check',
      provider,
      healthy,
      ...details
    });
  }

  // Utility methods for sanitizing sensitive data
  private sanitizeQuery(query: any): any {
    const sanitized = { ...query };
    // Remove or mask sensitive fields
    if (sanitized.password) delete sanitized.password;
    if (sanitized.token) sanitized.token = this.maskToken(sanitized.token);
    return sanitized;
  }

  private sanitizeEmail(email: string): string {
    if (!email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? 
      local.substring(0, 2) + '*'.repeat(local.length - 2) : 
      local;
    return `${maskedLocal}@${domain}`;
  }

  private maskToken(token: string): string {
    if (token.length <= 8) return '*'.repeat(token.length);
    return token.substring(0, 4) + '*'.repeat(token.length - 8) + token.substring(token.length - 4);
  }

  // Performance timing helper
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Performance: ${label}`, { durationMs: duration });
    };
  }

  // Create child logger with persistent context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.correlationId = this.correlationId;
    
    // Override log method to include persistent context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: string, message: string, additionalContext?: LogContext) => {
      originalLog(level, message, { ...context, ...additionalContext });
    };
    
    return childLogger;
  }
}

// Create singleton logger instance
const logger = new Logger();

export default logger;

// Generate unique correlation ID for request tracking
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Correlation ID middleware for Express
export function correlationMiddleware(req: any, res: any, next: any): void {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  logger.setCorrelationId(correlationId);
  
  // Clear correlation ID after request
  res.on('finish', () => {
    logger.clearCorrelationId();
  });
  
  next();
}
