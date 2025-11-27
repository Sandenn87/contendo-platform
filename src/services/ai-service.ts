import { supabaseAdmin } from '../config/supabase';
import { HealthcareService } from './healthcare-service';
import { TrainingService } from './training-service';
import { ArbiterService } from './arbiter-service';
import { QuickBooksService } from './quickbooks-service';
import logger from '../utils/logger';
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI | null = null;
  private healthcareService: HealthcareService;
  private trainingService: TrainingService;
  private arbiterService: ArbiterService;
  private quickbooksService: QuickBooksService;

  constructor(
    healthcareService: HealthcareService,
    trainingService: TrainingService,
    arbiterService: ArbiterService,
    quickbooksService: QuickBooksService
  ) {
    this.healthcareService = healthcareService;
    this.trainingService = trainingService;
    this.arbiterService = arbiterService;
    this.quickbooksService = quickbooksService;

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async getRecommendations(userId: string, limit: number = 10, category?: string): Promise<any[]> {
    // Get existing recommendations from database
    let query = supabaseAdmin
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('priority_score', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query;

    // If no recommendations exist or they're stale, generate new ones
    if (!data || data.length === 0) {
      return await this.refreshRecommendations(userId);
    }

    return data || [];
  }

  async refreshRecommendations(userId: string): Promise<any[]> {
    const recommendations: any[] = [];

    // 1. Profit generation opportunities
    const profitRecs = await this.generateProfitRecommendations(userId);
    recommendations.push(...profitRecs);

    // 2. Team support and growth
    const teamRecs = await this.generateTeamRecommendations(userId);
    recommendations.push(...teamRecs);

    // 3. Project health and velocity
    const projectRecs = await this.generateProjectHealthRecommendations(userId);
    recommendations.push(...projectRecs);

    // 4. Company profitability (acquisition readiness)
    const acquisitionRecs = await this.generateAcquisitionRecommendations(userId);
    recommendations.push(...acquisitionRecs);

    // Save recommendations
    if (recommendations.length > 0) {
      const recommendationsWithUserId = recommendations.map(rec => ({
        ...rec,
        user_id: userId
      }));

      await supabaseAdmin
        .from('ai_recommendations')
        .insert(recommendationsWithUserId);
    }

    return recommendations;
  }

  private async generateProfitRecommendations(userId: string): Promise<any[]> {
    const recommendations: any[] = [];

    // Check for SaaS renewals due soon
    const renewals = await this.healthcareService.getUpcomingRenewals(60);
    if (renewals.length > 0) {
      recommendations.push({
        priority_score: 1,
        category: 'profit',
        title: 'SaaS Renewals Approaching',
        description: `${renewals.length} SaaS agreement(s) need renewal attention`,
        action_items: renewals.map(r => `Renew ${r.project_id} - ${r.renewal_date}`)
      });
    }

    // Check for billing that needs invoicing
    const pendingBilling = await this.healthcareService.getBilling({ status: 'pending' });
    if (pendingBilling.length > 0) {
      recommendations.push({
        priority_score: 1,
        category: 'profit',
        title: 'Pending Invoices',
        description: `${pendingBilling.length} billing record(s) need invoice creation`,
        action_items: pendingBilling.map(b => `Create invoice for ${b.project_id}`)
      });
    }

    return recommendations;
  }

  private async generateTeamRecommendations(userId: string): Promise<any[]> {
    const recommendations: any[] = [];

    // Check for pending developer estimates
    const pendingEstimates = await this.healthcareService.getEstimates({ status: 'pending' });
    if (pendingEstimates.length > 0) {
      recommendations.push({
        priority_score: 2,
        category: 'team',
        title: 'Pending Developer Estimates',
        description: `${pendingEstimates.length} estimate(s) awaiting approval`,
        action_items: pendingEstimates.map(e => `Review estimate ${e.id}`)
      });
    }

    return recommendations;
  }

  private async generateProjectHealthRecommendations(userId: string): Promise<any[]> {
    const recommendations: any[] = [];

    // Check for projects with overdue milestones
    const projects = await this.trainingService.getProjects();
    for (const project of projects) {
      const milestones = await this.trainingService.getMilestones(project.id);
      const overdue = milestones.filter(m => {
        if (!m.target_date) return false;
        return new Date(m.target_date) < new Date() && m.status !== 'completed';
      });

      if (overdue.length > 0) {
        recommendations.push({
          priority_score: 3,
          category: 'project_health',
          title: `Overdue Milestones: ${project.name}`,
          description: `${overdue.length} milestone(s) are overdue`,
          action_items: overdue.map(m => `Update milestone: ${m.name}`)
        });
      }
    }

    return recommendations;
  }

  private async generateAcquisitionRecommendations(userId: string): Promise<any[]> {
    const recommendations: any[] = [];

    // Check financial health
    try {
      const health = await this.quickbooksService.getFinancialHealth(userId);
      if (health.cashFlow === 'negative') {
        recommendations.push({
          priority_score: 4,
          category: 'acquisition',
          title: 'Cash Flow Concerns',
          description: 'Negative cash flow detected - address to improve acquisition readiness',
          action_items: ['Review expenses', 'Accelerate receivables', 'Consider financing options']
        });
      }
    } catch (error) {
      // QuickBooks not connected or error
    }

    return recommendations;
  }

  async updateRecommendationStatus(id: string, status: string): Promise<any | null> {
    const { data, error } = await supabaseAdmin
      .from('ai_recommendations')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to update recommendation', error);
      throw error;
    }

    return data;
  }

  async askQuestion(userId: string, question: string, context?: any): Promise<any> {
    if (!this.openai) {
      return {
        answer: 'AI service not configured. Please set OPENAI_API_KEY environment variable.',
        sources: []
      };
    }

    try {
      // Gather context from database
      const contextData = await this.gatherContext(userId, context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a business management assistant for Contendo. Help answer questions about the business, projects, finances, and provide actionable insights.'
          },
          {
            role: 'user',
            content: `Context: ${JSON.stringify(contextData)}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.7
      });

      return {
        answer: response.choices[0].message.content,
        sources: []
      };
    } catch (error) {
      logger.error('Failed to process AI question', error);
      throw error;
    }
  }

  async generateReport(userId: string, reportType: string, parameters: any): Promise<any> {
    // Generate reports based on type
    switch (reportType) {
      case 'healthcare_profitability':
        return await this.healthcareService.getProfitability(parameters);
      case 'training_pl':
        return await this.trainingService.getProfitLossReport(parameters.projectId);
      case 'arbiter_profitability':
        return await this.arbiterService.getPlatformProfitability();
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async gatherContext(userId: string, context?: any): Promise<any> {
    // Gather relevant context from database
    return {
      timestamp: new Date().toISOString(),
      ...context
    };
  }
}

