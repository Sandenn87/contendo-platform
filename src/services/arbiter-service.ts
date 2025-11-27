import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export class ArbiterService {
  async getDeployments(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('arbiter_deployments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get deployments', error);
      throw error;
    }

    return data || [];
  }

  async getDeployment(id: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('arbiter_deployments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get deployment', error);
      throw error;
    }

    return data;
  }

  async createDeployment(deploymentData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('arbiter_deployments')
      .insert(deploymentData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create deployment', error);
      throw error;
    }

    return data;
  }

  async updateDeployment(id: string, updates: any): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('arbiter_deployments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update deployment', error);
      throw error;
    }

    return data;
  }

  async getServerCosts(deploymentId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('deployment_server_costs')
      .select('*')
      .eq('deployment_id', deploymentId)
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Failed to get server costs', error);
      throw error;
    }

    return data || [];
  }

  async addServerCost(deploymentId: string, costData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('deployment_server_costs')
      .insert({
        ...costData,
        deployment_id: deploymentId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add server cost', error);
      throw error;
    }

    return data;
  }

  async getMaintenance(deploymentId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('deployment_maintenance')
      .select('*, developers(*)')
      .eq('deployment_id', deploymentId)
      .order('date', { ascending: false });

    if (error) {
      logger.error('Failed to get maintenance', error);
      throw error;
    }

    return data || [];
  }

  async addMaintenance(deploymentId: string, maintenanceData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('deployment_maintenance')
      .insert({
        ...maintenanceData,
        deployment_id: deploymentId
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add maintenance', error);
      throw error;
    }

    return data;
  }

  async getSharedCosts(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('shared_platform_costs')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      logger.error('Failed to get shared costs', error);
      throw error;
    }

    return data || [];
  }

  async addSharedCost(costData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('shared_platform_costs')
      .insert(costData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to add shared cost', error);
      throw error;
    }

    return data;
  }

  async getDeploymentProfitability(deploymentId: string): Promise<any> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const monthlyRevenue = parseFloat(deployment.monthly_subscription_fee?.toString() || '0');

    // Get direct server costs
    const serverCosts = await this.getServerCosts(deploymentId);
    const monthlyServerCosts = serverCosts.reduce((sum, cost) => {
      return sum + parseFloat(cost.monthly_cost?.toString() || '0');
    }, 0);

    // Get maintenance costs (calculate monthly average)
    const maintenance = await this.getMaintenance(deploymentId);
    const developerRates: { [key: string]: number } = {};
    const maintenanceCosts = maintenance.reduce((sum, maint) => {
      const hours = parseFloat(maint.hours?.toString() || '0');
      const developerId = maint.developer_id;
      // You'd need to fetch developer rate here
      return sum; // Simplified
    }, 0);

    // Get shared costs allocation
    const sharedCosts = await this.getSharedCosts();
    const deployments = await this.getDeployments();
    const activeDeployments = deployments.filter(d => d.status === 'active').length;
    const monthlySharedCosts = sharedCosts.reduce((sum, cost) => {
      const costAmount = parseFloat(cost.monthly_cost?.toString() || '0');
      return sum + (costAmount / activeDeployments);
    }, 0);

    const totalMonthlyCosts = monthlyServerCosts + (maintenanceCosts / 12) + monthlySharedCosts;
    const monthlyProfit = monthlyRevenue - totalMonthlyCosts;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    return {
      deploymentId,
      monthlyRevenue,
      monthlyCosts: totalMonthlyCosts,
      monthlyProfit,
      profitMargin,
      annualRevenue: monthlyRevenue * 12,
      annualCosts: totalMonthlyCosts * 12,
      annualProfit: monthlyProfit * 12
    };
  }

  async getPlatformProfitability(): Promise<any> {
    const deployments = await this.getDeployments();
    const activeDeployments = deployments.filter(d => d.status === 'active');

    let totalMonthlyRevenue = 0;
    let totalMonthlyCosts = 0;

    for (const deployment of activeDeployments) {
      const profitability = await this.getDeploymentProfitability(deployment.id);
      totalMonthlyRevenue += profitability.monthlyRevenue;
      totalMonthlyCosts += profitability.monthlyCosts;
    }

    const monthlyProfit = totalMonthlyRevenue - totalMonthlyCosts;
    const profitMargin = totalMonthlyRevenue > 0 ? (monthlyProfit / totalMonthlyRevenue) * 100 : 0;

    return {
      totalDeployments: activeDeployments.length,
      totalMonthlyRevenue,
      totalMonthlyCosts,
      monthlyProfit,
      profitMargin,
      annualRevenue: totalMonthlyRevenue * 12,
      annualCosts: totalMonthlyCosts * 12,
      annualProfit: monthlyProfit * 12
    };
  }

  async getBusinessMetrics(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('arbiter_business_metrics')
      .select('*')
      .order('metric_date', { ascending: false })
      .limit(12);

    if (error) {
      logger.error('Failed to get business metrics', error);
      throw error;
    }

    return data || [];
  }

  async updateBusinessMetrics(metricsData: any): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('arbiter_business_metrics')
      .insert(metricsData)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update business metrics', error);
      throw error;
    }

    return data;
  }
}

