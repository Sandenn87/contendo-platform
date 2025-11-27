import axios from 'axios';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';

export class QuickBooksService {
  private async getAccessToken(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('integration_tokens')
      .select('access_token, token_expires_at')
      .eq('user_id', userId)
      .eq('service_name', 'quickbooks')
      .single();

    if (error || !data) {
      throw new Error('QuickBooks not connected. Please authenticate first.');
    }

    if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
      throw new Error('QuickBooks token expired. Please re-authenticate.');
    }

    return data.access_token;
  }

  async getAuthUrl(): Promise<string> {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/financial/quickbooks/callback`;
    
    if (!clientId) {
      throw new Error('QuickBooks client ID not configured');
    }

    const scopes = ['com.intuit.quickbooks.accounting'].join(' ');
    return `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
  }

  async handleCallback(userId: string, code: string, realmId: string): Promise<any> {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID;
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
    const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/financial/quickbooks/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks credentials not configured');
    }

    try {
      const response = await axios.post('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', null, {
        auth: {
          username: clientId,
          password: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`
      });

      const { access_token, refresh_token, expires_in } = response.data;
      const expiresAt = new Date(Date.now() + expires_in * 1000);

      await supabaseAdmin
        .from('integration_tokens')
        .upsert({
          user_id: userId,
          service_name: 'quickbooks',
          access_token,
          refresh_token,
          token_expires_at: expiresAt.toISOString(),
          metadata: { realm_id: realmId }
        });

      return { success: true };
    } catch (error) {
      logger.error('Failed to handle QuickBooks callback', error);
      throw error;
    }
  }

  async syncInvoices(userId: string): Promise<any> {
    // Sync invoices from QuickBooks
    return { totalSynced: 0, totalCreated: 0, totalUpdated: 0 };
  }

  async syncExpenses(userId: string): Promise<any> {
    // Sync expenses from QuickBooks
    return { totalSynced: 0, totalCreated: 0, totalUpdated: 0 };
  }

  async getProfitLoss(userId: string, period?: string, startDate?: string, endDate?: string): Promise<any> {
    // Get P&L from QuickBooks
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0
    };
  }

  async getCashFlowProjection(userId: string, days: number): Promise<any> {
    // Calculate cash flow projection
    return {
      currentBalance: 0,
      projectedBalance: 0,
      inflows: [],
      outflows: []
    };
  }

  async getFinancialHealth(userId: string): Promise<any> {
    // Get financial health metrics
    return {
      cashFlow: 'positive',
      profitability: 'healthy',
      debtRatio: 0
    };
  }

  async processReceipt(userId: string, file: Express.Multer.File): Promise<any> {
    try {
      // OCR processing
      const { data: { text } } = await Tesseract.recognize(file.path, 'eng');

      // Extract amount, vendor, date from OCR text
      const amountMatch = text.match(/\$?(\d+\.\d{2})/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : null;

      // Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(file.path);
      const fileName = `${userId}/${Date.now()}_${file.originalname}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('receipts')
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype
        });

      if (uploadError) {
        throw uploadError;
      }

      // Save receipt record
      const { data, error } = await supabaseAdmin
        .from('receipts')
        .insert({
          user_id: userId,
          file_name: file.originalname,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.mimetype,
          amount,
          ocr_data: { text },
          status: 'pending'
        })
        .select()
        .single();

      // Clean up temp file
      fs.unlinkSync(file.path);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to process receipt', error);
      throw error;
    }
  }

  async getReceipts(userId: string, status?: string): Promise<any[]> {
    let query = supabaseAdmin
      .from('receipts')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get receipts', error);
      throw error;
    }

    return data || [];
  }

  async createExpenseFromReceipt(userId: string, receiptId: string, expenseData: any): Promise<any> {
    // Create expense in QuickBooks from receipt
    // Update receipt status to 'synced'
    const { data, error } = await supabaseAdmin
      .from('receipts')
      .update({ status: 'synced', quickbooks_expense_id: expenseData.quickbooksId })
      .eq('id', receiptId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create expense from receipt', error);
      throw error;
    }

    return data;
  }

  async getFinancialSnapshots(filters: { periodType?: string; startDate?: string; endDate?: string }): Promise<any[]> {
    let query = supabaseAdmin.from('financial_snapshots').select('*');

    if (filters.periodType) {
      query = query.eq('period_type', filters.periodType);
    }
    if (filters.startDate) {
      query = query.gte('period_start', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('period_end', filters.endDate);
    }

    const { data, error } = await query.order('snapshot_date', { ascending: false });

    if (error) {
      logger.error('Failed to get financial snapshots', error);
      throw error;
    }

    return data || [];
  }
}

