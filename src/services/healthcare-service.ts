import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export interface HealthcareClient {
  id: string;
  name: string;
  network_name: string;
  contact_email?: string;
  primary_contact_id?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthcareProject {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SaaSAgreement {
  id: string;
  project_id: string;
  annual_fee: number;
  start_date: string;
  end_date: string;
  renewal_date: string;
  auto_renew: boolean;
  status: string;
  quickbooks_invoice_id?: string;
  notes?: string;
}

export interface Developer {
  id: string;
  name: string;
  email?: string;
  hourly_rate?: number;
  is_active: boolean;
}

export class HealthcareService {
  async getClients(): Promise<HealthcareClient[]> {
    const { data, error } = await supabaseAdmin
      .from('healthcare_clients')
      .select('*')
      .order('name');

    if (error) {
      logger.error('Failed to get healthcare clients', error);
      throw error;
    }

    return data || [];
  }

  async getClient(id: string): Promise<HealthcareClient | null> {
    const { data, error } = await supabaseAdmin
      .from('healthcare_clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get healthcare client', error);
      throw error;
    }

    return data;
  }

  async createClient(clientData: Partial<HealthcareClient>): Promise<HealthcareClient> {
    const { data, error } = await supabaseAdmin
      .from('healthcare_clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create healthcare client', error);
      throw error;
    }

    return data;
  }

  async updateClient(id: string, updates: Partial<HealthcareClient>): Promise<HealthcareClient | null> {
    const { data, error } = await supabaseAdmin
      .from('healthcare_clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update healthcare client', error);
      throw error;
    }

    return data;
  }

  async getProjectsByClient(clientId: string): Promise<HealthcareProject[]> {
    const { data, error } = await supabaseAdmin
      .from('healthcare_projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get projects', error);
      throw error;
    }

    return data || [];
  }

  async getSaaSAgreements(filters: { projectId?: string; status?: string }): Promise<SaaSAgreement[]> {
    let query = supabaseAdmin.from('saas_agreements').select('*');

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('renewal_date');

    if (error) {
      logger.error('Failed to get SaaS agreements', error);
      throw error;
    }

    return data || [];
  }

  async getUpcomingRenewals(days: number): Promise<SaaSAgreement[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const { data, error } = await supabaseAdmin
      .from('saas_agreements')
      .select('*')
      .gte('renewal_date', today.toISOString().split('T')[0])
      .lte('renewal_date', futureDate.toISOString().split('T')[0])
      .order('renewal_date');

    if (error) {
      logger.error('Failed to get upcoming renewals', error);
      throw error;
    }

    return data || [];
  }

  async createSaaSAgreement(agreementData: Partial<SaaSAgreement>): Promise<SaaSAgreement> {
    const { data, error } = await supabaseAdmin
      .from('saas_agreements')
      .insert(agreementData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create SaaS agreement', error);
      throw error;
    }

    return data;
  }

  async getDevelopers(): Promise<Developer[]> {
    const { data, error } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('Failed to get developers', error);
      throw error;
    }

    return data || [];
  }

  async assignDeveloper(projectId: string, assignment: { developerId: string; role?: string; hourlyRate?: number }): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_developers')
      .insert({
        project_id: projectId,
        developer_id: assignment.developerId,
        role: assignment.role || 'developer',
        hourly_rate: assignment.hourlyRate
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to assign developer', error);
      throw error;
    }

    return data;
  }

  async getEstimates(filters: { projectId?: string; status?: string }): Promise<any[]> {
    let query = supabaseAdmin.from('developer_estimates').select('*');

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get estimates', error);
      throw error;
    }

    return data || [];
  }

  async updateEstimateStatus(estimateId: string, status: string, approvedBy: string): Promise<any> {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approved_by = approvedBy;
      updateData.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('developer_estimates')
      .update(updateData)
      .eq('id', estimateId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update estimate', error);
      throw error;
    }

    return data;
  }

  async getBilling(filters: { projectId?: string; status?: string }): Promise<any[]> {
    let query = supabaseAdmin.from('project_billing').select('*');

    if (filters.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('billing_date', { ascending: false });

    if (error) {
      logger.error('Failed to get billing', error);
      throw error;
    }

    return data || [];
  }

  async createBilling(billingData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_billing')
      .insert(billingData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create billing', error);
      throw error;
    }

    return data;
  }

  async getProfitability(filters: { projectId?: string; clientId?: string }): Promise<any> {
    // Calculate profitability based on revenue and costs
    // This is a simplified version - you'd want to join with time_entries and costs
    const projects = filters.projectId
      ? await supabaseAdmin.from('healthcare_projects').select('*').eq('id', filters.projectId)
      : filters.clientId
      ? await supabaseAdmin.from('healthcare_projects').select('*').eq('client_id', filters.clientId)
      : await supabaseAdmin.from('healthcare_projects').select('*');

    // Get agreements and billing for revenue calculation
    // Get developer costs and time entries for cost calculation
    // Return profitability metrics

    return {
      totalRevenue: 0,
      totalCosts: 0,
      profit: 0,
      profitMargin: 0
    };
  }

  async getMeetingParticipants(projectId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('meeting_participants')
      .select('*, contacts(*)')
      .eq('project_id', projectId);

    if (error) {
      logger.error('Failed to get meeting participants', error);
      throw error;
    }

    return data || [];
  }

  async addMeetingParticipant(participantData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('meeting_participants')
      .insert(participantData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to add meeting participant', error);
      throw error;
    }

    return data;
  }
}

