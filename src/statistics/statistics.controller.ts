import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { Session } from '../auth/session.interface';

@ApiTags('statistics')
@ApiCookieAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: Session) {
    return this.statisticsService.getDashboardSummary(user.id);
  }

  @Get('statistics')
  getStatistics(@CurrentUser() user: Session) {
    return this.statisticsService.getStatistics(user.id);
  }
}
