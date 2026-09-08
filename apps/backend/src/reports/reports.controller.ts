import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser('tenantId') tenantId: string) {
    return this.reportsService.dashboard(tenantId);
  }

  @Get('monthly')
  monthly(
    @CurrentUser('tenantId') tenantId: string,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
  ) {
    return this.reportsService.monthly(tenantId, year, month);
  }

  @Get('mass-intentions')
  massIntentions(@CurrentUser('tenantId') tenantId: string) {
    return this.reportsService.massIntentionsReport(tenantId);
  }
}
