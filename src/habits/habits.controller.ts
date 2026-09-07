import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { HabitDto } from './dto/habit.dto';
import { ProgressDto } from './dto/progress.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { Session } from '../auth/session.interface';

@ApiTags('habits')
@ApiCookieAuth()
@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  getHabits(@CurrentUser() user: Session) {
    return this.habitsService.getHabits(user.id);
  }

  @Get(':id')
  getHabit(@CurrentUser() user: Session, @Param('id') id: string) {
    return this.habitsService.getHabit(user.id, id);
  }

  @Post()
  createHabit(@CurrentUser() user: Session, @Body() dto: HabitDto) {
    return this.habitsService.createHabit(user.id, dto);
  }

  @Patch(':id')
  updateHabit(
    @CurrentUser() user: Session,
    @Param('id') id: string,
    @Body() dto: HabitDto,
  ) {
    return this.habitsService.updateHabit(user.id, id, dto);
  }

  @Delete(':id')
  deleteHabit(@CurrentUser() user: Session, @Param('id') id: string) {
    return this.habitsService.deleteHabit(user.id, id);
  }

  @Patch(':id/active')
  toggleActive(@CurrentUser() user: Session, @Param('id') id: string) {
    return this.habitsService.toggleActive(user.id, id);
  }

  @Patch(':id/progress')
  setProgress(
    @CurrentUser() user: Session,
    @Param('id') id: string,
    @Body() dto: ProgressDto,
  ) {
    return this.habitsService.setTodayProgress(user.id, id, dto.progress);
  }
}
