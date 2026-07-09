import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { GetAnalyticsDto } from './dto/get-analytics.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics(@Query() query: GetAnalyticsDto) {
    // We execute both heavy database queries in parallel using Promise.all
    // This cuts the response time in half compared to awaiting them sequentially.
    const [trends, categoryBreakdown] = await Promise.all([
      this.analyticsService.getMonthlyTrends(query.userId),
      this.analyticsService.getCategoryBreakdown(query.userId),
    ]);

    return {
      success: true,
      data: {
        trends,
        categoryBreakdown,
      },
    };
  }
}