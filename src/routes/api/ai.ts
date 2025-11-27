import { Router, Response } from 'express';
import { AIService } from '../../services/ai-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

export function createAIRouter(aiService: AIService): Router {
  const router = Router();

  router.use(authenticateUser);

  // Get AI recommendations
  router.get('/recommendations', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { limit = '10', category } = req.query;
      const recommendations = await aiService.getRecommendations(
        req.user!.id,
        parseInt(limit as string),
        category as string
      );
      res.json(recommendations);
    } catch (error) {
      logger.error('Failed to get recommendations', error);
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  });

  // Update recommendation status
  router.put('/recommendations/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      const recommendation = await aiService.updateRecommendationStatus(
        req.params.id,
        status
      );
      if (!recommendation) {
        res.status(404).json({ error: 'Recommendation not found' }); return;
        return;
      }
      res.json(recommendation);
    } catch (error) {
      logger.error('Failed to update recommendation', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update recommendation' });
    }
  });

  // Chat interface - ask questions
  router.post('/chat', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { question, context } = req.body;
      if (!question) {
        res.status(400).json({ error: 'Question is required' }); return;
      }
      const response = await aiService.askQuestion(req.user!.id, question, context);
      res.json(response);
    } catch (error) {
      logger.error('Failed to process chat question', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to process question' });
    }
  });

  // Generate report
  router.post('/generate-report', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { reportType, parameters } = req.body;
      const report = await aiService.generateReport(req.user!.id, reportType, parameters);
      res.json(report);
    } catch (error) {
      logger.error('Failed to generate report', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate report' });
    }
  });

  // Refresh recommendations (force recalculation)
  router.post('/recommendations/refresh', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const recommendations = await aiService.refreshRecommendations(req.user!.id);
      res.json(recommendations);
    } catch (error) {
      logger.error('Failed to refresh recommendations', error);
      res.status(500).json({ error: 'Failed to refresh recommendations' });
    }
  });

  return router;
}

