import { HealthcareService } from './healthcare-service';
import { TrainingService } from './training-service';
import { ArbiterService } from './arbiter-service';
import { QuickBooksService } from './quickbooks-service';
import { AIService } from './ai-service';

export class DashboardService {
  constructor(
    private healthcareService: HealthcareService,
    private trainingService: TrainingService,
    private arbiterService: ArbiterService,
    private quickbooksService: QuickBooksService,
    private aiService: AIService
  ) {}

  async getDashboardData(userId: string): Promise<any> {
    const [healthcare, training, arbiter, financial, aiRecs] = await Promise.all([
      this.getHealthcareSummary(),
      this.getTrainingSummary(),
      this.getArbiterSummary(),
      this.getFinancialSummary(userId),
      this.getAIRecommendations(userId)
    ]);

    return {
      healthcare,
      training,
      arbiter,
      financial,
      aiRecommendations: aiRecs,
      lastUpdated: new Date().toISOString()
    };
  }

  async getHealthcareSummary(): Promise<any> {
    const clients = await this.healthcareService.getClients();
    const renewals = await this.healthcareService.getUpcomingRenewals(30);
    const profitability = await this.healthcareService.getProfitability({});

    return {
      totalClients: clients.length,
      activeProjects: clients.filter(c => c.status === 'active').length,
      upcomingRenewals: renewals.length,
      profitability: {
        revenue: profitability.totalRevenue,
        costs: profitability.totalCosts,
        profit: profitability.profit,
        margin: profitability.profitMargin
      }
    };
  }

  async getTrainingSummary(): Promise<any> {
    const projects = await this.trainingService.getProjects();
    const activeProjects = projects.filter(p => p.status === 'active');

    let totalRevenue = 0;
    let totalCosts = 0;

    for (const project of activeProjects) {
      const pl = await this.trainingService.getProfitLossReport(project.id);
      totalRevenue += pl.totalRevenue;
      totalCosts += pl.totalCosts;
    }

    return {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalRevenue,
      totalCosts,
      totalProfit: totalRevenue - totalCosts,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0
    };
  }

  async getArbiterSummary(): Promise<any> {
    const profitability = await this.arbiterService.getPlatformProfitability();
    const deployments = await this.arbiterService.getDeployments();
    const activeDeployments = deployments.filter(d => d.status === 'active');

    return {
      totalDeployments: deployments.length,
      activeDeployments: activeDeployments.length,
      monthlyRevenue: profitability.monthlyRevenue,
      monthlyCosts: profitability.monthlyCosts,
      monthlyProfit: profitability.monthlyProfit,
      profitMargin: profitability.profitMargin
    };
  }

  async getFinancialSummary(userId: string): Promise<any> {
    try {
      const health = await this.quickbooksService.getFinancialHealth(userId);
      const cashFlow = await this.quickbooksService.getCashFlowProjection(userId, 30);
      const pl = await this.quickbooksService.getProfitLoss(userId, 'month');

      return {
        cashFlow: {
          current: cashFlow.currentBalance,
          projected: cashFlow.projectedBalance
        },
        profitLoss: {
          revenue: pl.totalRevenue,
          expenses: pl.totalExpenses,
          netIncome: pl.netIncome
        },
        health: {
          status: health.cashFlow,
          profitability: health.profitability
        }
      };
    } catch (error) {
      // QuickBooks not connected
      return {
        cashFlow: { current: 0, projected: 0 },
        profitLoss: { revenue: 0, expenses: 0, netIncome: 0 },
        health: { status: 'unknown', profitability: 'unknown' }
      };
    }
  }

  async getAIRecommendations(userId: string): Promise<any[]> {
    return await this.aiService.getRecommendations(userId, 5);
  }
}

