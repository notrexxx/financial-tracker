import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('demo-dashboard')
  async getDemoDashboard() {
    const demoUserId = 'demo-guest-user-123';
    
    await this.analyticsService.autoProvisionUser(demoUserId);
    
    const [trends, categoryBreakdown] = await Promise.all([
      this.analyticsService.getMonthlyTrends(demoUserId),
      this.analyticsService.getCategoryBreakdown(demoUserId),
    ]);

    return {
      success: true,
      data: { trends, categoryBreakdown },
    };
  }

  @UseGuards(ClerkAuthGuard)
  @Get('dashboard')
  async getDashboardMetrics(@Req() req: any) {
    const secureUserId = req.user.id;
    
    await this.analyticsService.autoProvisionUser(secureUserId);

    const [trends, categoryBreakdown] = await Promise.all([
      this.analyticsService.getMonthlyTrends(secureUserId),
      this.analyticsService.getCategoryBreakdown(secureUserId),
    ]);

    return {
      success: true,
      data: { trends, categoryBreakdown },
    };
  }
}