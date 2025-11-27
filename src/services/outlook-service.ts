import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export class OutlookService {
  private async getAccessToken(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('integration_tokens')
      .select('access_token, token_expires_at')
      .eq('user_id', userId)
      .eq('service_name', 'microsoft_graph')
      .single();

    if (error || !data) {
      throw new Error('Microsoft Graph not connected. Please authenticate first.');
    }

    if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
      throw new Error('Microsoft Graph token expired. Please re-authenticate.');
    }

    return data.access_token;
  }

  async getAuthUrl(): Promise<string> {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/crm/outlook/callback`;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    
    if (!clientId) {
      throw new Error('Microsoft client ID not configured');
    }

    const scopes = ['Mail.Read', 'Mail.ReadWrite'].join(' ');
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scopes)}`;
  }

  async handleCallback(userId: string, code: string): Promise<any> {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/crm/outlook/callback`;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

    if (!clientId || !clientSecret) {
      throw new Error('Microsoft credentials not configured');
    }

    try {
      const response = await axios.post(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      await supabaseAdmin
        .from('integration_tokens')
        .upsert({
          user_id: userId,
          service_name: 'microsoft_graph',
          access_token,
          refresh_token,
          token_expires_at: expiresAt.toISOString()
        });

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle Outlook callback', error);
      throw error;
    }
  }

  async scanAndUpdateHubSpot(userId: string, days: number): Promise<any> {
    const token = await this.getAccessToken(userId);
    const since = new Date();
    since.setDate(since.getDate() - days);

    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          $filter: `receivedDateTime ge ${since.toISOString()}`,
          $select: 'subject,body,from,toRecipients',
          $top: 100
        }
      });

      const emails = response.data.value || [];
      let contactsFound = 0;
      let dealsUpdated = 0;
      let accountsUpdated = 0;

      // Parse emails and extract contact/deal information
      // Update HubSpot records accordingly
      // This is a simplified version - you'd want more sophisticated parsing

      // Log scan
      await supabaseAdmin.from('email_scan_log').insert({
        emails_scanned: emails.length,
        contacts_found: contactsFound,
        deals_updated: dealsUpdated,
        accounts_updated: accountsUpdated,
        status: 'completed',
        scan_completed_at: new Date().toISOString()
      });

      return {
        emailsScanned: emails.length,
        contactsFound,
        dealsUpdated,
        accountsUpdated
      };
    } catch (error) {
      logger.error('Failed to scan emails', error);
      throw error;
    }
  }
}

