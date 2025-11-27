import { Router, Response } from 'express';
import { ArbiterService } from '../../services/arbiter-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

export function createArbiterRouter(arbiterService: ArbiterService): Router {
  const router = Router();

  router.use(authenticateUser);

  // Get all deployments
  router.get('/deployments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deployments = await arbiterService.getDeployments();
      res.json(deployments);
    } catch (error) {
      logger.error('Failed to get deployments', error);
      res.status(500).json({ error: 'Failed to get deployments' });
    }
  });

  // Get single deployment
  router.get('/deployments/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deployment = await arbiterService.getDeployment(req.params.id);
      if (!deployment) {
        res.status(404).json({ error: 'Deployment not found' }); return;
      }
      res.json(deployment);
    } catch (error) {
      logger.error('Failed to get deployment', error);
      res.status(500).json({ error: 'Failed to get deployment' });
    }
  });

  // Create deployment
  router.post('/deployments', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deployment = await arbiterService.createDeployment(req.body);
      res.status(201).json(deployment);
    } catch (error) {
      logger.error('Failed to create deployment', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create deployment' });
    }
  });

  // Update deployment
  router.put('/deployments/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const deployment = await arbiterService.updateDeployment(req.params.id, req.body);
      if (!deployment) {
        res.status(404).json({ error: 'Deployment not found' }); return;
      }
      res.json(deployment);
    } catch (error) {
      logger.error('Failed to update deployment', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update deployment' });
    }
  });

  // Get server costs for deployment
  router.get('/deployments/:deploymentId/server-costs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const costs = await arbiterService.getServerCosts(req.params.deploymentId);
      res.json(costs);
    } catch (error) {
      logger.error('Failed to get server costs', error);
      res.status(500).json({ error: 'Failed to get server costs' });
    }
  });

  // Add server cost
  router.post('/deployments/:deploymentId/server-costs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cost = await arbiterService.addServerCost(req.params.deploymentId, req.body);
      res.status(201).json(cost);
    } catch (error) {
      logger.error('Failed to add server cost', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add server cost' });
    }
  });

  // Get maintenance hours
  router.get('/deployments/:deploymentId/maintenance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const maintenance = await arbiterService.getMaintenance(req.params.deploymentId);
      res.json(maintenance);
    } catch (error) {
      logger.error('Failed to get maintenance', error);
      res.status(500).json({ error: 'Failed to get maintenance' });
    }
  });

  // Add maintenance hours
  router.post('/deployments/:deploymentId/maintenance', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const maintenance = await arbiterService.addMaintenance(req.params.deploymentId, req.body);
      res.status(201).json(maintenance);
    } catch (error) {
      logger.error('Failed to add maintenance', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add maintenance' });
    }
  });

  // Get shared platform costs
  router.get('/shared-costs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const costs = await arbiterService.getSharedCosts();
      res.json(costs);
    } catch (error) {
      logger.error('Failed to get shared costs', error);
      res.status(500).json({ error: 'Failed to get shared costs' });
    }
  });

  // Add shared platform cost
  router.post('/shared-costs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cost = await arbiterService.addSharedCost(req.body);
      res.status(201).json(cost);
    } catch (error) {
      logger.error('Failed to add shared cost', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add shared cost' });
    }
  });

  // Get profitability for deployment
  router.get('/deployments/:deploymentId/profitability', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const profitability = await arbiterService.getDeploymentProfitability(req.params.deploymentId);
      res.json(profitability);
    } catch (error) {
      logger.error('Failed to get profitability', error);
      res.status(500).json({ error: 'Failed to get profitability' });
    }
  });

  // Get overall platform profitability
  router.get('/profitability', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const profitability = await arbiterService.getPlatformProfitability();
      res.json(profitability);
    } catch (error) {
      logger.error('Failed to get platform profitability', error);
      res.status(500).json({ error: 'Failed to get platform profitability' });
    }
  });

  // Get business metrics
  router.get('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const metrics = await arbiterService.getBusinessMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Failed to get business metrics', error);
      res.status(500).json({ error: 'Failed to get business metrics' });
    }
  });

  // Update business metrics
  router.post('/metrics', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const metrics = await arbiterService.updateBusinessMetrics(req.body);
      res.status(201).json(metrics);
    } catch (error) {
      logger.error('Failed to update business metrics', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update metrics' });
    }
  });

  return router;
}

