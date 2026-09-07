import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { decorateHabit, type HabitWithProgress } from '../habits/habit-progress.util';

export interface DailyPoint {
  label: string;
  percent: number;
}

export interface DashboardSummary {
  activeCount: number;
  completedToday: number;
  percentToday: number;
  currentStreak: number;
  bestStreak: number;
  weekly: DailyPoint[];
  monthly: DailyPoint[];
  habits: HabitWithProgress[];
  isEmpty: boolean;
}

export interface CategoryBreakdown {
  name: string;
  value: number;
}

export interface StatisticsSummary {
  totalHabits: number;
  activeHabits: number;
  finishedHabits: number;
  bestStreak: number;
  byCategory: CategoryBreakdown[];
  weekly: DailyPoint[];
  monthly: DailyPoint[];
}

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    const [rawHabits, records] = await Promise.all([
      this.prisma.habit.findMany({ where: { userId } }),
      this.prisma.habitRecord.findMany({ where: { userId } }),
    ]);
    const habits = rawHabits.map((h) => decorateHabit(h, records));

    const active = habits.filter((h) => h.active);
    const completedToday = active.filter((h) => h.completedToday).length;
    const percentToday = active.length
      ? Math.round((completedToday / active.length) * 100)
      : 0;
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
    const currentStreak = active.reduce((max, h) => Math.max(max, h.streak), 0);

    const weekly: DailyPoint[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRecords = records.filter(
        (r) => r.date === key && active.some((h) => h.id === r.habitId),
      );
      const done = dayRecords.filter((r) => r.progress >= 100).length;
      const percent = active.length ? Math.round((done / active.length) * 100) : 0;
      weekly.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), percent });
    }

    const monthly: DailyPoint[] = [];
    for (let w = 3; w >= 0; w -= 1) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < 7; i += 1) {
        const d = new Date();
        d.setDate(d.getDate() - w * 7 - i);
        const key = d.toISOString().slice(0, 10);
        const dayRecords = records.filter(
          (r) => r.date === key && active.some((h) => h.id === r.habitId),
        );
        if (active.length) {
          const done = dayRecords.filter((r) => r.progress >= 100).length;
          sum += done / active.length;
          count += 1;
        }
      }
      monthly.push({
        label: `Week ${4 - w}`,
        percent: count ? Math.round((sum / count) * 100) : 0,
      });
    }

    return {
      activeCount: active.length,
      completedToday,
      percentToday,
      currentStreak,
      bestStreak,
      weekly,
      monthly,
      habits: active.slice(0, 5),
      isEmpty: habits.length === 0,
    };
  }

  async getStatistics(userId: string): Promise<StatisticsSummary> {
    const rawHabits = await this.prisma.habit.findMany({ where: { userId } });
    const records = await this.prisma.habitRecord.findMany({ where: { userId } });
    const habits = rawHabits.map((h) => decorateHabit(h, records));

    const totalHabits = habits.length;
    const activeHabits = habits.filter((h) => h.active).length;
    const finishedHabits = habits.filter(
      (h) => h.endDate && new Date(h.endDate) < new Date(),
    ).length;
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);

    const byCategory: Record<string, number> = {};
    habits.forEach((h) => {
      byCategory[h.category] = (byCategory[h.category] || 0) + 1;
    });

    const summary = await this.getDashboardSummary(userId);

    return {
      totalHabits,
      activeHabits,
      finishedHabits,
      bestStreak,
      byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      weekly: summary.weekly,
      monthly: summary.monthly,
    };
  }
}
