import { Router, Response } from 'express';
import { TrainingService } from '../../services/training-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

export function createTrainingRouter(trainingService: TrainingService): Router {
  const router = Router();

  router.use(authenticateUser);

  // Get all training projects
  router.get('/projects', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const projects = await trainingService.getProjects();
      res.json(projects);
    } catch (error) {
      logger.error('Failed to get training projects', error);
      res.status(500).json({ error: 'Failed to get training projects' });
    }
  });

  // Get single project
  router.get('/projects/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const project = await trainingService.getProject(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (error) {
      logger.error('Failed to get training project', error);
      res.status(500).json({ error: 'Failed to get training project' });
    }
  });

  // Create project
  router.post('/projects', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const project = await trainingService.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      logger.error('Failed to create training project', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create project' });
    }
  });

  // Update project
  router.put('/projects/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const project = await trainingService.updateProject(req.params.id, req.body);
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }
      res.json(project);
    } catch (error) {
      logger.error('Failed to update training project', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update project' });
    }
  });

  // Get milestones for a project
  router.get('/projects/:projectId/milestones', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const milestones = await trainingService.getMilestones(req.params.projectId);
      res.json(milestones);
    } catch (error) {
      logger.error('Failed to get milestones', error);
      res.status(500).json({ error: 'Failed to get milestones' });
    }
  });

  // Create/update milestone
  router.post('/projects/:projectId/milestones', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const milestone = await trainingService.createMilestone(req.params.projectId, req.body);
      res.status(201).json(milestone);
    } catch (error) {
      logger.error('Failed to create milestone', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create milestone' });
    }
  });

  // Update milestone progress
  router.put('/milestones/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const milestone = await trainingService.updateMilestone(req.params.id, req.body);
      if (!milestone) {
        res.status(404).json({ error: 'Milestone not found' });
        return;
      }
      res.json(milestone);
    } catch (error) {
      logger.error('Failed to update milestone', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update milestone' });
    }
  });

  // Get cost centers for a project
  router.get('/projects/:projectId/cost-centers', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const costCenters = await trainingService.getCostCenters(req.params.projectId);
      res.json(costCenters);
    } catch (error) {
      logger.error('Failed to get cost centers', error);
      res.status(500).json({ error: 'Failed to get cost centers' });
    }
  });

  // Get employees for a project
  router.get('/projects/:projectId/employees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const employees = await trainingService.getEmployees(req.params.projectId);
      res.json(employees);
    } catch (error) {
      logger.error('Failed to get employees', error);
      res.status(500).json({ error: 'Failed to get employees' });
    }
  });

  // Add employee to project
  router.post('/projects/:projectId/employees', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const employee = await trainingService.addEmployee(req.params.projectId, req.body);
      res.status(201).json(employee);
    } catch (error) {
      logger.error('Failed to add employee', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add employee' });
    }
  });

  // Update employee hours/costs
  router.put('/employees/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const employee = await trainingService.updateEmployee(req.params.id, req.body);
      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }
      res.json(employee);
    } catch (error) {
      logger.error('Failed to update employee', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update employee' });
    }
  });

  // Add project cost
  router.post('/projects/:projectId/costs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const cost = await trainingService.addCost(req.params.projectId, req.body);
      res.status(201).json(cost);
    } catch (error) {
      logger.error('Failed to add cost', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to add cost' });
    }
  });

  // Get P&L report
  router.get('/projects/:projectId/pl', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const pl = await trainingService.getProfitLossReport(req.params.projectId);
      res.json(pl);
    } catch (error) {
      logger.error('Failed to get P&L report', error);
      res.status(500).json({ error: 'Failed to get P&L report' });
    }
  });

  // Get invoices
  router.get('/projects/:projectId/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const invoices = await trainingService.getInvoices(req.params.projectId);
      res.json(invoices);
    } catch (error) {
      logger.error('Failed to get invoices', error);
      res.status(500).json({ error: 'Failed to get invoices' });
    }
  });

  // Create invoice
  router.post('/projects/:projectId/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const invoice = await trainingService.createInvoice(req.params.projectId, req.body);
      res.status(201).json(invoice);
    } catch (error) {
      logger.error('Failed to create invoice', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create invoice' });
    }
  });

  // Share report with contacts
  router.post('/projects/:projectId/share-report', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { contactIds, reportType } = req.body;
      const result = await trainingService.shareReport(req.params.projectId, contactIds, reportType);
      res.json(result);
    } catch (error) {
      logger.error('Failed to share report', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to share report' });
    }
  });

  return router;
}

