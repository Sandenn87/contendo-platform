import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import logger, { correlationMiddleware } from './utils/logger';

// Import services
import { HealthcareService } from './services/healthcare-service';
import { TrainingService } from './services/training-service';
import { ArbiterService } from './services/arbiter-service';
import { HubSpotService } from './services/hubspot-service';
import { QuickBooksService } from './services/quickbooks-service';
import { OutlookService } from './services/outlook-service';
import { AIService } from './services/ai-service';
import { DashboardService } from './services/dashboard-service';

// Import routes
import { createHealthcareRouter } from './routes/api/healthcare';
import { createTrainingRouter } from './routes/api/training';
import { createArbiterRouter } from './routes/api/arbiter';
import { createCrmRouter } from './routes/api/crm';
import { createFinancialRouter } from './routes/api/financial';
import { createAIRouter } from './routes/api/ai';
import { createDashboardRouter } from './routes/api/dashboard';

export class ContendoServer {
  private app: express.Application;
  private httpServer: any;
  private startTime: Date;
  private port: number;

  // Services
  private healthcareService: HealthcareService;
  private trainingService: TrainingService;
  private arbiterService: ArbiterService;
  private hubspotService: HubSpotService;
  private quickbooksService: QuickBooksService;
  private outlookService: OutlookService;
  private aiService: AIService;
  private dashboardService: DashboardService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.startTime = new Date();
    this.port = parseInt(process.env.PORT || '3000');

    // Initialize services
    this.healthcareService = new HealthcareService();
    this.trainingService = new TrainingService();
    this.arbiterService = new ArbiterService();
    this.hubspotService = new HubSpotService();
    this.quickbooksService = new QuickBooksService();
    this.outlookService = new OutlookService();
    this.aiService = new AIService(
      this.healthcareService,
      this.trainingService,
      this.arbiterService,
      this.quickbooksService
    );
    this.dashboardService = new DashboardService(
      this.healthcareService,
      this.trainingService,
      this.arbiterService,
      this.quickbooksService,
      this.aiService
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:", "https://*.supabase.co"]
        }
      }
    }));

    // CORS - Allow React dev server and production
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'http://localhost:3000']
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use('/api/', limiter);

    // Session middleware
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'contendo-session-secret-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Correlation ID middleware
    this.app.use(correlationMiddleware);

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      if (!req.url.startsWith('/css') && !req.url.startsWith('/js') && !req.url.startsWith('/images')) {
        logger.info('HTTP request', {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          correlationId: (req as any).correlationId
        });
      }
      next();
    });

    // Serve static files from React build (in production)
    if (process.env.NODE_ENV === 'production') {
      this.app.use(express.static(path.join(__dirname, '../client/dist')));
    }
  }

  private setupRoutes(): void {
    // API Routes
    this.app.use('/api/healthcare', createHealthcareRouter(this.healthcareService));
    this.app.use('/api/training', createTrainingRouter(this.trainingService));
    this.app.use('/api/arbiter', createArbiterRouter(this.arbiterService));
    this.app.use('/api/crm', createCrmRouter(this.hubspotService, this.outlookService));
    this.app.use('/api/financial', createFinancialRouter(this.quickbooksService));
    this.app.use('/api/ai', createAIRouter(this.aiService));
    this.app.use('/api/dashboard', createDashboardRouter(this.dashboardService));

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: this.getUptime()
      });
    });

    // API info
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'Contendo Business Management Platform API',
        version: '1.0.0',
        endpoints: {
          healthcare: '/api/healthcare',
          training: '/api/training',
          arbiter: '/api/arbiter',
          crm: '/api/crm',
          financial: '/api/financial',
          ai: '/api/ai',
          dashboard: '/api/dashboard'
        }
      });
    });

    // In production, serve React app for all non-API routes
    if (process.env.NODE_ENV === 'production') {
      this.app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      });
    } else {
      // In development, redirect to React dev server
      this.app.get('*', (req: Request, res: Response) => {
        res.json({
          message: 'Development mode - React app should be running on http://localhost:5173',
          api: 'http://localhost:3000/api'
        });
      });
    }
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Unhandled request error', error, {
        method: req.method,
        url: req.url,
        correlationId: (req as any).correlationId
      });

      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        correlationId: (req as any).correlationId
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled promise rejection', reason);
      this.gracefulShutdown('unhandledRejection');
    });

    // Handle termination signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });
  }

  async start(): Promise<void> {
    try {
      this.httpServer.listen(this.port, () => {
        logger.info('Contendo Business Management Platform server started', {
          port: this.port,
          nodeEnv: process.env.NODE_ENV || 'development'
        });
      });

      this.httpServer.on('error', (error: Error) => {
        logger.error('Server error', error);
      });

    } catch (error) {
      logger.error('Failed to start server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.httpServer) {
        resolve();
        return;
      }

      this.httpServer.close((error: Error | undefined) => {
        if (error) {
          logger.error('Error stopping server', error);
          reject(error);
        } else {
          logger.info('Server stopped');
          resolve();
        }
      });
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Graceful shutdown initiated: ${signal}`);

    try {
      await this.stop();
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  private getUptime(): string {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }
}
