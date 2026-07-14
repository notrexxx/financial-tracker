import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // PUBLIC ROUTE: Used for portfolio demo mode (no authentication needed)
  @Get('demo-dashboard')
  async getDemoDashboard() {
    // We point this to your specific Clerk ID that is linked to your 10,000 transactions
    const demoUserId = 'user_3GHoR6yTlblgtvsIJFtdBhZtEcK'; 
    
    const [trends, categoryBreakdown] = await Promise.all([
      this.analyticsService.getMonthlyTrends(demoUserId),
      this.analyticsService.getCategoryBreakdown(demoUserId),
    ]);

    return {
      success: true,
      data: { trends, categoryBreakdown },
    };
  }

  // PROTECTED ROUTE: Strictly requires a valid Clerk JWT
  @UseGuards(ClerkAuthGuard)
  @Get('dashboard')
  async getDashboardMetrics(@Req() req: any) {
    const secureUserId = req.user.id;
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