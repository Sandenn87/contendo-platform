import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export class HubSpotService {
  private async getAccessToken(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('integration_tokens')
      .select('access_token, token_expires_at')
      .eq('user_id', userId)
      .eq('service_name', 'hubspot')
      .single();

    if (error || !data) {
      throw new Error('HubSpot not connected. Please authenticate first.');
    }

    // Check if token is expired and refresh if needed
    if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
      // Refresh token logic would go here
      throw new Error('HubSpot token expired. Please re-authenticate.');
    }

    return data.access_token;
  }

  async getAuthUrl(): Promise<string> {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/crm/hubspot/callback`;
    
    if (!clientId) {
      throw new Error('HubSpot client ID not configured');
    }

    const scopes = ['contacts', 'deals', 'companies'].join(' ');
    return `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  async handleCallback(userId: string, code: string): Promise<any> {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/crm/hubspot/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('HubSpot credentials not configured');
    }

    try {
      const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
        params: {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code
        }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      // Store tokens
      const { error } = await supabaseAdmin
        .from('integration_tokens')
        .upsert({
          user_id: userId,
          service_name: 'hubspot',
          access_token,
          refresh_token,
          token_expires_at: expiresAt.toISOString()
        });

      if (error) {
        logger.error('Failed to store HubSpot tokens', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle HubSpot callback', error);
      throw error;
    }
  }

  async syncContacts(userId: string): Promise<any> {
    const token = await this.getAccessToken(userId);
    let after: string | undefined;
    let totalSynced = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    try {
      do {
        const response = await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100, after }
        });

        const contacts = response.data.results || [];
        after = response.data.paging?.next?.after;

        for (const contact of contacts) {
          const { data: existing } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('hubspot_id', contact.id)
            .single();

          const contactData = {
            hubspot_id: contact.id,
            email: contact.properties?.email,
            first_name: contact.properties?.firstname,
            last_name: contact.properties?.lastname,
            phone: contact.properties?.phone,
            title: contact.properties?.jobtitle,
            company_name: contact.properties?.company
          };

          if (existing) {
            await supabaseAdmin
              .from('contacts')
              .update(contactData)
              .eq('id', existing.id);
            totalUpdated++;
          } else {
            await supabaseAdmin.from('contacts').insert(contactData);
            totalCreated++;
          }
          totalSynced++;
        }
      } while (after);

      // Log sync
      await supabaseAdmin.from('hubspot_sync_log').insert({
        sync_type: 'contacts',
        records_synced: totalSynced,
        records_created: totalCreated,
        records_updated: totalUpdated,
        status: 'completed',
        sync_completed_at: new Date().toISOString()
      });

      return { totalSynced, totalCreated, totalUpdated };
    } catch (error) {
      logger.error('Failed to sync contacts', error);
      throw error;
    }
  }

  async syncAccounts(userId: string): Promise<any> {
    const token = await this.getAccessToken(userId);
    let after: string | undefined;
    let totalSynced = 0;
    let totalCreated = 0;
    let totalUpdated = 0;

    try {
      do {
        const response = await axios.get('https://api.hubapi.com/crm/v3/objects/companies', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 100, after }
        });

        const companies = response.data.results || [];
        after = response.data.paging?.next?.after;

        for (const company of companies) {
          const { data: existing } = await supabaseAdmin
            .from('accounts')
            .select('id')
            .eq('hubspot_id', company.id)
            .single();

          const accountData = {
            hubspot_id: company.id,
            name: company.properties?.name,
            domain: company.properties?.domain,
            industry: company.properties?.industry,
            phone: company.properties?.phone,
            address: company.properties?.address,
            city: company.properties?.city,
            state: company.properties?.state,
            country: company.properties?.country
          };

          if (existing) {
            await supabaseAdmin
              .from('accounts')
              .update(accountData)
              .eq('id', existing.id);
            totalUpdated++;
          } else {
            await supabaseAdmin.from('accounts').insert(accountData);
            totalCreated++;
          }
          totalSynced++;
        }
      } while (after);

      return { totalSynced, totalCreated, totalUpdated };
    } catch (error) {
      logger.error('Failed to sync accounts', error);
      throw error;
    }
  }

  async syncDeals(userId: string): Promise<any> {
    // Similar implementation for deals
    return { totalSynced: 0, totalCreated: 0, totalUpdated: 0 };
  }

  async getDealStageChanges(userId: string, since?: string): Promise<any[]> {
    // Get deal stage changes from HubSpot
    return [];
  }

  async getContacts(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .order('last_name');

    return data || [];
  }

  async getAccounts(): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .order('name');

    return data || [];
  }

  async linkContactToAccount(contactId: string, accountId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('account_contacts')
      .insert({ contact_id: contactId, account_id: accountId })
      .select()
      .single();

    if (error) {
      logger.error('Failed to link contact to account', error);
      throw error;
    }

    return data;
  }
}

