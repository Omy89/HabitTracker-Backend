import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { Session } from '../auth/session.interface';

@Controller()
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: Session) {
    return this.statsService.getDashboardSummary(user.id);
  }

  @Get('statistics')
  getStatistics(@CurrentUser() user: Session) {
    return this.statsService.getStatistics(user.id);
  }
}
