import { Router, Response } from 'express';
import { DashboardService } from '../../services/dashboard-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

export function createDashboardRouter(dashboardService: DashboardService): Router {
  const router = Router();

  router.use(authenticateUser);

  // Get main dashboard data
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboard = await dashboardService.getDashboardData(req.user!.id);
      res.json(dashboard);
    } catch (error) {
      logger.error('Failed to get dashboard data', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  });

  // Get healthcare division summary
  router.get('/healthcare', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await dashboardService.getHealthcareSummary();
      res.json(summary);
    } catch (error) {
      logger.error('Failed to get healthcare summary', error);
      res.status(500).json({ error: 'Failed to get healthcare summary' });
    }
  });

  // Get training projects summary
  router.get('/training', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await dashboardService.getTrainingSummary();
      res.json(summary);
    } catch (error) {
      logger.error('Failed to get training summary', error);
      res.status(500).json({ error: 'Failed to get training summary' });
    }
  });

  // Get Arbiter summary
  router.get('/arbiter', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await dashboardService.getArbiterSummary();
      res.json(summary);
    } catch (error) {
      logger.error('Failed to get Arbiter summary', error);
      res.status(500).json({ error: 'Failed to get Arbiter summary' });
    }
  });

  // Get financial summary
  router.get('/financial', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const summary = await dashboardService.getFinancialSummary(req.user!.id);
      res.json(summary);
    } catch (error) {
      logger.error('Failed to get financial summary', error);
      res.status(500).json({ error: 'Failed to get financial summary' });
    }
  });

  // Get AI recommendations for dashboard
  router.get('/ai-recommendations', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const recommendations = await dashboardService.getAIRecommendations(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      logger.error('Failed to get AI recommendations', error);
      res.status(500).json({ error: 'Failed to get AI recommendations' });
    }
  });

  return router;
}

