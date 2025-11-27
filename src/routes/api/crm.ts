import { Router, Response } from 'express';
import { HubSpotService } from '../../services/hubspot-service';
import { OutlookService } from '../../services/outlook-service';
import { authenticateUser, AuthenticatedRequest } from '../../middleware/auth';
import logger from '../../utils/logger';

export function createCrmRouter(
  hubspotService: HubSpotService,
  outlookService: OutlookService
): Router {
  const router = Router();

  router.use(authenticateUser);

  // HubSpot OAuth initiation
  router.get('/hubspot/auth', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUrl = await hubspotService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      logger.error('Failed to get HubSpot auth URL', error);
      res.status(500).json({ error: 'Failed to get auth URL' });
    }
  });

  // HubSpot OAuth callback
  router.get('/hubspot/callback', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }
      const result = await hubspotService.handleCallback(req.user!.id, code as string);
      res.json(result);
    } catch (error) {
      logger.error('Failed to handle HubSpot callback', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to authenticate' });
    }
  });

  // Sync contacts from HubSpot
  router.post('/hubspot/sync/contacts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await hubspotService.syncContacts(req.user!.id);
      res.json(result);
    } catch (error) {
      logger.error('Failed to sync contacts', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync contacts' });
    }
  });

  // Sync accounts from HubSpot
  router.post('/hubspot/sync/accounts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await hubspotService.syncAccounts(req.user!.id);
      res.json(result);
    } catch (error) {
      logger.error('Failed to sync accounts', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync accounts' });
    }
  });

  // Sync deals from HubSpot
  router.post('/hubspot/sync/deals', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await hubspotService.syncDeals(req.user!.id);
      res.json(result);
    } catch (error) {
      logger.error('Failed to sync deals', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to sync deals' });
    }
  });

  // Get deal stage change notifications
  router.get('/hubspot/deal-changes', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { since } = req.query;
      const changes = await hubspotService.getDealStageChanges(req.user!.id, since as string);
      res.json(changes);
    } catch (error) {
      logger.error('Failed to get deal changes', error);
      res.status(500).json({ error: 'Failed to get deal changes' });
    }
  });

  // Microsoft Graph OAuth initiation
  router.get('/outlook/auth', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authUrl = await outlookService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      logger.error('Failed to get Outlook auth URL', error);
      res.status(500).json({ error: 'Failed to get auth URL' });
    }
  });

  // Microsoft Graph OAuth callback
  router.get('/outlook/callback', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }
      const result = await outlookService.handleCallback(req.user!.id, code as string);
      res.json(result);
    } catch (error) {
      logger.error('Failed to handle Outlook callback', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to authenticate' });
    }
  });

  // Scan emails and update HubSpot
  router.post('/outlook/scan-emails', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { days = '7' } = req.body;
      const result = await outlookService.scanAndUpdateHubSpot(req.user!.id, parseInt(days));
      res.json(result);
    } catch (error) {
      logger.error('Failed to scan emails', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to scan emails' });
    }
  });

  // Get all contacts
  router.get('/contacts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const contacts = await hubspotService.getContacts();
      res.json(contacts);
    } catch (error) {
      logger.error('Failed to get contacts', error);
      res.status(500).json({ error: 'Failed to get contacts' });
    }
  });

  // Get all accounts
  router.get('/accounts', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accounts = await hubspotService.getAccounts();
      res.json(accounts);
    } catch (error) {
      logger.error('Failed to get accounts', error);
      res.status(500).json({ error: 'Failed to get accounts' });
    }
  });

  // Link contact to account
  router.post('/contacts/:contactId/accounts/:accountId', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await hubspotService.linkContactToAccount(
        req.params.contactId,
        req.params.accountId
      );
      res.json(result);
    } catch (error) {
      logger.error('Failed to link contact to account', error);
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to link' });
    }
  });

  return router;
}

