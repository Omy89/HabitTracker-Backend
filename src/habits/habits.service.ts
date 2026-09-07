import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decorateHabit, type HabitWithProgress } from './habit-progress.util';
import type { HabitDto } from './dto/habit.dto';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findOwned(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit || habit.userId !== userId) {
      throw new NotFoundException('Habit not found.');
    }
    return habit;
  }

  async getHabits(userId: string): Promise<HabitWithProgress[]> {
    const [habits, records] = await Promise.all([
      this.prisma.habit.findMany({ where: { userId } }),
      this.prisma.habitRecord.findMany({ where: { userId } }),
    ]);
    const order: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    return habits
      .map((h) => decorateHabit(h, records))
      .sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3));
  }

  async getHabit(userId: string, habitId: string): Promise<HabitWithProgress> {
    const habit = await this.findOwned(userId, habitId);
    const records = await this.prisma.habitRecord.findMany({ where: { habitId } });
    return decorateHabit(habit, records);
  }

  async createHabit(userId: string, dto: HabitDto): Promise<HabitWithProgress> {
    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
        category: dto.category,
        frequency: dto.frequency,
        priority: dto.priority,
        startDate: dto.startDate || todayISO(),
        endDate: dto.endDate ?? '',
        active: true,
      },
    });
    return decorateHabit(habit, []);
  }

  async updateHabit(
    userId: string,
    habitId: string,
    dto: HabitDto,
  ): Promise<HabitWithProgress> {
    const existing = await this.findOwned(userId, habitId);
    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() ?? '',
        category: dto.category,
        frequency: dto.frequency,
        priority: dto.priority,
        startDate: dto.startDate || existing.startDate,
        endDate: dto.endDate ?? '',
      },
    });
    const records = await this.prisma.habitRecord.findMany({ where: { habitId } });
    return decorateHabit(habit, records);
  }

  async deleteHabit(userId: string, habitId: string): Promise<boolean> {
    await this.findOwned(userId, habitId);
    await this.prisma.habit.delete({ where: { id: habitId } });
    return true;
  }

  async toggleActive(userId: string, habitId: string): Promise<HabitWithProgress> {
    const existing = await this.findOwned(userId, habitId);
    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: { active: !existing.active },
    });
    const records = await this.prisma.habitRecord.findMany({ where: { habitId } });
    return decorateHabit(habit, records);
  }

  async setTodayProgress(
    userId: string,
    habitId: string,
    progress: number,
  ): Promise<HabitWithProgress> {
    const habit = await this.findOwned(userId, habitId);
    const today = todayISO();
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    await this.prisma.habitRecord.upsert({
      where: { habitId_date: { habitId, date: today } },
      create: { habitId, userId, date: today, progress: clamped },
      update: { progress: clamped },
    });
    const records = await this.prisma.habitRecord.findMany({ where: { habitId } });
    return decorateHabit(habit, records);
  }
}
