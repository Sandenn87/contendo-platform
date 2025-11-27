import { Router, Response } from 'express';
import { HealthcareService } from '../../services/healthcare-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

export function createHealthcareRouter(healthcareService: HealthcareService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticateUser);

  // Get all healthcare clients
  router.get('/clients', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const clients = await healthcareService.getClients();
      res.json(clients);
    } catch (error) {
      logger.error('Failed to get healthcare clients', error);
      res.status(500).json({ error: 'Failed to get healthcare clients' });
    }
  });

  // Get single client
  router.get('/clients/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await healthcareService.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      logger.error('Failed to get healthcare client', error);
      res.status(500).json({ error: 'Failed to get healthcare client' });
    }
  });

  // Create client
  router.post('/clients', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await healthcareService.createClient(req.body);
      res.status(201).json(client);
    } catch (error) {
      logger.error('Failed to create healthcare client', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create client' });
    }
  });

  // Update client
  router.put('/clients/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await healthcareService.updateClient(req.params.id, req.body);
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    } catch (error) {
      logger.error('Failed to update healthcare client', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update client' });
    }
  });

  // Get projects for a client
  router.get('/clients/:clientId/projects', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const projects = await healthcareService.getProjectsByClient(req.params.clientId);
      res.json(projects);
    } catch (error) {
      logger.error('Failed to get projects', error);
      res.status(500).json({ error: 'Failed to get projects' });
    }
  });

  // Get SaaS agreements
  router.get('/agreements', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, status } = req.query;
      const agreements = await healthcareService.getSaaSAgreements({
        projectId: projectId as string,
        status: status as string
      });
      res.json(agreements);
    } catch (error) {
      logger.error('Failed to get SaaS agreements', error);
      res.status(500).json({ error: 'Failed to get SaaS agreements' });
    }
  });

  // Get renewals due soon
  router.get('/agreements/renewals', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { days = '30' } = req.query;
      const renewals = await healthcareService.getUpcomingRenewals(parseInt(days as string));
      res.json(renewals);
    } catch (error) {
      logger.error('Failed to get renewals', error);
      res.status(500).json({ error: 'Failed to get renewals' });
    }
  });

  // Create/update SaaS agreement
  router.post('/agreements', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const agreement = await healthcareService.createSaaSAgreement(req.body);
      res.status(201).json(agreement);
    } catch (error) {
      logger.error('Failed to create SaaS agreement', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create agreement' });
    }
  });

  // Get developers
  router.get('/developers', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const developers = await healthcareService.getDevelopers();
      res.json(developers);
    } catch (error) {
      logger.error('Failed to get developers', error);
      res.status(500).json({ error: 'Failed to get developers' });
    }
  });

  // Assign developer to project
  router.post('/projects/:projectId/developers', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const assignment = await healthcareService.assignDeveloper(req.params.projectId, req.body);
      res.status(201).json(assignment);
    } catch (error) {
      logger.error('Failed to assign developer', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to assign developer' });
    }
  });

  // Get developer estimates
  router.get('/estimates', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, status } = req.query;
      const estimates = await healthcareService.getEstimates({
        projectId: projectId as string,
        status: status as string
      });
      res.json(estimates);
    } catch (error) {
      logger.error('Failed to get estimates', error);
      res.status(500).json({ error: 'Failed to get estimates' });
    }
  });

  // Approve/reject estimate
  router.put('/estimates/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, approvedBy } = req.body;
      const estimate = await healthcareService.updateEstimateStatus(
        req.params.id,
        status,
        req.user!.id
      );
      if (!estimate) {
        return res.status(404).json({ error: 'Estimate not found' });
      }
      res.json(estimate);
    } catch (error) {
      logger.error('Failed to update estimate', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update estimate' });
    }
  });

  // Get billing records
  router.get('/billing', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, status } = req.query;
      const billing = await healthcareService.getBilling({
        projectId: projectId as string,
        status: status as string
      });
      res.json(billing);
    } catch (error) {
      logger.error('Failed to get billing', error);
      res.status(500).json({ error: 'Failed to get billing' });
    }
  });

  // Create billing record
  router.post('/billing', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const billing = await healthcareService.createBilling(req.body);
      res.status(201).json(billing);
    } catch (error) {
      logger.error('Failed to create billing', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create billing' });
    }
  });

  // Get profitability data
  router.get('/profitability', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, clientId } = req.query;
      const profitability = await healthcareService.getProfitability({
        projectId: projectId as string,
        clientId: clientId as string
      });
      res.json(profitability);
    } catch (error) {
      logger.error('Failed to get profitability', error);
      res.status(500).json({ error: 'Failed to get profitability' });
    }
  });

  // Get meeting participants
  router.get('/meetings/participants', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId } = req.query;
      const participants = await healthcareService.getMeetingParticipants(req.params.projectId || projectId as string);
      res.json(participants);
    } catch (error) {
      logger.error('Failed to get meeting participants', error);
      res.status(500).json({ error: 'Failed to get meeting participants' });
    }
  });

  // Add meeting participant
  router.post('/meetings/participants', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const participant = await healthcareService.addMeetingParticipant(req.body);
      res.status(201).json(participant);
    } catch (error) {
      logger.error('Failed to add meeting participant', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add participant' });
    }
  });

  return router;
}

