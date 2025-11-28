import { Router, Response } from 'express';
import { QuickBooksService } from '../../services/quickbooks-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

export function createFinancialRouter(quickbooksService: QuickBooksService): Router {
  const router = Router();

  router.use(authenticateUser);

  // QuickBooks OAuth initiation
  router.get('/quickbooks/auth', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const authUrl = await quickbooksService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      logger.error('Failed to get QuickBooks auth URL', error);
      res.status(500).json({ error: 'Failed to get auth URL' });
    }
  });

  // QuickBooks OAuth callback
  router.get('/quickbooks/callback', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { code, realmId } = req.query;
      if (!code || !realmId) {
        res.status(400).json({ error: 'Authorization code and realm ID required' });
        return;
      }
      const result = await quickbooksService.handleCallback(
        req.user!.id,
        code as string,
        realmId as string
      );
      res.json(result);
    } catch (error) {
      logger.error('Failed to handle QuickBooks callback', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to authenticate' });
    }
  });

  // Sync invoices from QuickBooks
  router.post('/quickbooks/sync/invoices', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await quickbooksService.syncInvoices(req.user!.id);
      res.json(result);
    } catch (error) {
      logger.error('Failed to sync invoices', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync invoices' });
    }
  });

  // Sync expenses from QuickBooks
  router.post('/quickbooks/sync/expenses', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await quickbooksService.syncExpenses(req.user!.id);
      res.json(result);
    } catch (error) {
      logger.error('Failed to sync expenses', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync expenses' });
    }
  });

  // Get P&L report
  router.get('/pl', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { period, startDate, endDate } = req.query;
      const pl = await quickbooksService.getProfitLoss(
        req.user!.id,
        period as string,
        startDate as string,
        endDate as string
      );
      res.json(pl);
    } catch (error) {
      logger.error('Failed to get P&L', error);
      res.status(500).json({ error: 'Failed to get P&L report' });
    }
  });

  // Get cash flow projection
  router.get('/cash-flow', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { days = '30' } = req.query;
      const cashFlow = await quickbooksService.getCashFlowProjection(req.user!.id, parseInt(days as string));
      res.json(cashFlow);
    } catch (error) {
      logger.error('Failed to get cash flow', error);
      res.status(500).json({ error: 'Failed to get cash flow projection' });
    }
  });

  // Get financial health metrics
  router.get('/health', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const health = await quickbooksService.getFinancialHealth(req.user!.id);
      res.json(health);
    } catch (error) {
      logger.error('Failed to get financial health', error);
      res.status(500).json({ error: 'Failed to get financial health' });
    }
  });

  // Upload receipt
  router.post('/receipts', upload.single('receipt'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Receipt file required' });
        return;
        return;
      }
      const receipt = await quickbooksService.processReceipt(req.user!.id, req.file);
      res.status(201).json(receipt);
    } catch (error) {
      logger.error('Failed to process receipt', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to process receipt' });
    }
  });

  // Get receipts
  router.get('/receipts', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      const receipts = await quickbooksService.getReceipts(req.user!.id, status as string);
      res.json(receipts);
    } catch (error) {
      logger.error('Failed to get receipts', error);
      res.status(500).json({ error: 'Failed to get receipts' });
    }
  });

  // Create expense from receipt
  router.post('/receipts/:receiptId/expense', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const expense = await quickbooksService.createExpenseFromReceipt(
        req.user!.id,
        req.params.receiptId,
        req.body
      );
      res.status(201).json(expense);
    } catch (error) {
      logger.error('Failed to create expense', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create expense' });
    }
  });

  // Get financial snapshots
  router.get('/snapshots', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { periodType, startDate, endDate } = req.query;
      const snapshots = await quickbooksService.getFinancialSnapshots({
        periodType: periodType as string,
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json(snapshots);
    } catch (error) {
      logger.error('Failed to get financial snapshots', error);
      res.status(500).json({ error: 'Failed to get financial snapshots' });
    }
  });

  return router;
}

