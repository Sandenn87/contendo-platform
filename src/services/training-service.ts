import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export class TrainingService {
  async getProjects(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('training_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get training projects', error);
      throw error;
    }

    return data || [];
  }

  async getProject(id: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('training_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get training project', error);
      throw error;
    }

    return data;
  }

  async createProject(projectData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('training_projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create training project', error);
      throw error;
    }

    return data;
  }

  async updateProject(id: string, updates: any): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('training_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update training project', error);
      throw error;
    }

    return data;
  }

  async getMilestones(projectId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (error) {
      logger.error('Failed to get milestones', error);
      throw error;
    }

    return data || [];
  }

  async createMilestone(projectId: string, milestoneData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_milestones')
      .insert({
        ...milestoneData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create milestone', error);
      throw error;
    }

    return data;
  }

  async updateMilestone(id: string, updates: any): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('project_milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update milestone', error);
      throw error;
    }

    return data;
  }

  async getCostCenters(projectId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('cost_centers')
      .select('*')
      .eq('project_id', projectId)
      .order('name');

    if (error) {
      logger.error('Failed to get cost centers', error);
      throw error;
    }

    return data || [];
  }

  async getEmployees(projectId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('project_employees')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('employee_name');

    if (error) {
      logger.error('Failed to get employees', error);
      throw error;
    }

    return data || [];
  }

  async addEmployee(projectId: string, employeeData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_employees')
      .insert({
        ...employeeData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add employee', error);
      throw error;
    }

    return data;
  }

  async updateEmployee(id: string, updates: any): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('project_employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update employee', error);
      throw error;
    }

    return data;
  }

  async addCost(projectId: string, costData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_costs')
      .insert({
        ...costData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add cost', error);
      throw error;
    }

    return data;
  }

  async getProfitLossReport(projectId: string): Promise<any> {
    // Get project invoices (revenue)
    const { data: invoices } = await supabaseAdmin
      .from('project_invoices')
      .select('amount')
      .eq('project_id', projectId)
      .eq('status', 'paid');

    const totalRevenue = invoices?.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0) || 0;

    // Get project costs
    const { data: costs } = await supabaseAdmin
      .from('project_costs')
      .select('amount')
      .eq('project_id', projectId);

    const totalCosts = costs?.reduce((sum, cost) => sum + parseFloat(cost.amount.toString()), 0) || 0;

    // Get employee costs (hours * rate)
    const { data: employees } = await supabaseAdmin
      .from('project_employees')
      .select('actual_hours, hourly_rate')
      .eq('project_id', projectId);

    const employeeCosts = employees?.reduce((sum, emp) => {
      const hours = parseFloat(emp.actual_hours?.toString() || '0');
      const rate = parseFloat(emp.hourly_rate?.toString() || '0');
      return sum + (hours * rate);
    }, 0) || 0;

    const totalCostsWithEmployees = totalCosts + employeeCosts;
    const profit = totalRevenue - totalCostsWithEmployees;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    return {
      projectId,
      totalRevenue,
      totalCosts: totalCostsWithEmployees,
      employeeCosts,
      otherCosts: totalCosts,
      profit,
      profitMargin
    };
  }

  async getInvoices(projectId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('project_invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('invoice_date', { ascending: false });

    if (error) {
      logger.error('Failed to get invoices', error);
      throw error;
    }

    return data || [];
  }

  async createInvoice(projectId: string, invoiceData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('project_invoices')
      .insert({
        ...invoiceData,
        project_id: projectId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create invoice', error);
      throw error;
    }

    return data;
  }

  async shareReport(projectId: string, contactIds: string[], reportType: string): Promise<any> {
    // Add recipients to report_recipients table
    const recipients = contactIds.map(contactId => ({
      project_id: projectId,
      contact_id: contactId,
      report_type: reportType
    }));

    const { data, error } = await supabaseAdmin
      .from('report_recipients')
      .insert(recipients)
      .select();

    if (error) {
      logger.error('Failed to share report', error);
      throw error;
    }

    // In a real implementation, you'd also send emails here
    return { success: true, recipients: data };
  }
}

