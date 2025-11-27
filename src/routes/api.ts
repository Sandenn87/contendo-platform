import { Router, Request, Response } from 'express';
import { BookingConfigurationManager } from '../services/configuration-manager';
import { CourseDiscoveryService } from '../services/course-discovery';
import { BookingHistoryService } from '../services/booking-history';
import { SettingsManager } from '../services/settings-manager';
import { AppConfig, BookingConfiguration } from '../types';
import logger from '../utils/logger';

interface ApiRouterDependencies {
  configManager: BookingConfigurationManager;
  courseDiscovery: CourseDiscoveryService;
  historyService: BookingHistoryService;
  settingsManager: SettingsManager;
  appConfig: AppConfig;
}

export function createApiRouter(dependencies: ApiRouterDependencies): Router {
  const router = Router();
  const { configManager, courseDiscovery, historyService, settingsManager } = dependencies;

  // Configuration Management
  router.get('/configurations', async (req: Request, res: Response) => {
    try {
      const configurations = await configManager.getAllConfigurations();
      res.json(configurations);
    } catch (error) {
      logger.error('Failed to get configurations', error);
      res.status(500).json({ error: 'Failed to get configurations' });
    }
  });

  router.get('/configurations/:id', async (req: Request, res: Response) => {
    try {
      const configuration = await configManager.getConfiguration(req.params.id);
      if (!configuration) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      return res.json(configuration);
    } catch (error) {
      logger.error('Failed to get configuration', error);
      return res.status(500).json({ error: 'Failed to get configuration' });
    }
  });

  router.post('/configurations', async (req: Request, res: Response) => {
    try {
      const configuration = await configManager.createConfiguration(req.body);
      res.status(201).json(configuration);
    } catch (error) {
      logger.error('Failed to create configuration', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create configuration' });
    }
  });

  router.put('/configurations/:id', async (req: Request, res: Response) => {
    try {
      const configuration = await configManager.updateConfiguration(req.params.id, req.body);
      if (!configuration) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      return res.json(configuration);
    } catch (error) {
      logger.error('Failed to update configuration', error);
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update configuration' });
    }
  });

  router.delete('/configurations/:id', async (req: Request, res: Response) => {
    try {
      const success = await configManager.deleteConfiguration(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete configuration', error);
      return res.status(500).json({ error: 'Failed to delete configuration' });
    }
  });

  router.post('/configurations/:id/toggle', async (req: Request, res: Response) => {
    try {
      const { active } = req.body;
      const configuration = await configManager.toggleConfiguration(req.params.id, active);
      if (!configuration) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      return res.json(configuration);
    } catch (error) {
      logger.error('Failed to toggle configuration', error);
      return res.status(500).json({ error: 'Failed to toggle configuration' });
    }
  });

  // Course Discovery
  router.get('/courses', async (req: Request, res: Response) => {
    try {
      const courses = await courseDiscovery.getCachedCourses();
      res.json(courses);
    } catch (error) {
      logger.error('Failed to get courses', error);
      res.status(500).json({ error: 'Failed to get courses' });
    }
  });

  router.post('/courses/search', async (req: Request, res: Response) => {
    try {
      const { query, authData } = req.body;
      
      if (!query || !authData) {
        return res.status(400).json({ error: 'Query and auth data are required' });
      }

      const courses = await courseDiscovery.searchCourses(query, authData);
      return res.json(courses);
    } catch (error) {
      logger.error('Course search failed', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Course search failed' });
    }
  });

  // Authentication Testing
  router.post('/auth/test', async (req: Request, res: Response) => {
    try {
      const authData = req.body;
      const result = await courseDiscovery.testAuthentication(authData);
      res.json(result);
    } catch (error) {
      logger.error('Auth test failed', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Authentication test failed' });
    }
  });

  // Booking History
  router.get('/history', async (req: Request, res: Response) => {
    try {
      const {
        configurationId,
        status,
        startDate,
        endDate,
        limit = '100',
        offset = '0'
      } = req.query;

      const filters = {
        configurationId: configurationId as string,
        status: status as 'pending' | 'success' | 'failed' | 'cancelled',
        startDate: startDate as string,
        endDate: endDate as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const history = await historyService.getBookingHistory(filters);
      res.json(history);
    } catch (error) {
      logger.error('Failed to get booking history', error);
      res.status(500).json({ error: 'Failed to get booking history' });
    }
  });

  // Settings Management
  router.get('/settings', async (req: Request, res: Response) => {
    try {
      const settings = await settingsManager.getSettings();
      res.json(settings);
    } catch (error) {
      logger.error('Failed to get settings', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  router.put('/settings', async (req: Request, res: Response) => {
    try {
      const settings = await settingsManager.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      logger.error('Failed to update settings', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update settings' });
    }
  });

  // Tee Time Release Monitoring
  router.post('/configurations/:id/release-schedule', async (req: Request, res: Response) => {
    try {
      const { releaseTime, releaseDays, timezone } = req.body;
      const schedule = await configManager.updateReleaseSchedule(req.params.id, {
        enabled: true,
        releaseTime,
        releaseDays,
        timezone
      });
      res.json(schedule);
    } catch (error) {
      logger.error('Failed to update release schedule', error);
      res.status(500).json({ error: 'Failed to update release schedule' });
    }
  });

  router.delete('/configurations/:id/release-schedule', async (req: Request, res: Response) => {
    try {
      await configManager.updateReleaseSchedule(req.params.id, { enabled: false });
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to disable release schedule', error);
      res.status(500).json({ error: 'Failed to disable release schedule' });
    }
  });

  // Analytics and Stats
  router.get('/analytics/summary', async (req: Request, res: Response) => {
    try {
      const summary = await historyService.getAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      logger.error('Failed to get analytics summary', error);
      res.status(500).json({ error: 'Failed to get analytics summary' });
    }
  });

  router.get('/analytics/course/:courseId', async (req: Request, res: Response) => {
    try {
      const analytics = await historyService.getCourseAnalytics(req.params.courseId);
      res.json(analytics);
    } catch (error) {
      logger.error('Failed to get course analytics', error);
      res.status(500).json({ error: 'Failed to get course analytics' });
    }
  });

  // Import/Export
  router.get('/export/configurations', async (req: Request, res: Response) => {
    try {
      const configurations = await configManager.exportConfigurations();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=chronoautotee-configurations.json');
      res.json(configurations);
    } catch (error) {
      logger.error('Failed to export configurations', error);
      res.status(500).json({ error: 'Failed to export configurations' });
    }
  });

  router.post('/import/configurations', async (req: Request, res: Response) => {
    try {
      const { configurations, overwrite = false } = req.body;
      const result = await configManager.importConfigurations(configurations, overwrite);
      res.json(result);
    } catch (error) {
      logger.error('Failed to import configurations', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to import configurations' });
    }
  });

  // Error handling middleware
  router.use((error: Error, req: Request, res: Response, next: any) => {
    logger.error('API route error', error, {
      method: req.method,
      url: req.url,
      correlationId: (req as any).correlationId
    });

    res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      correlationId: (req as any).correlationId
    });
  });

  return router;
}
