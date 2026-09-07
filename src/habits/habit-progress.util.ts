import type { Habit, HabitRecord } from '@prisma/client';

export interface HabitWithProgress {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  priority: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt: string;
  streak: number;
  bestStreak: number;
  todayProgress: number;
  completedToday: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeStreaks(
  habitId: string,
  records: HabitRecord[],
): { streak: number; bestStreak: number } {
  const byDate = new Map(
    records
      .filter((r) => r.habitId === habitId)
      .map((r) => [r.date, r.progress >= 100]),
  );

  let current = 0;
  const cursor = new Date();
  if (!byDate.get(todayISO())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (byDate.get(key)) {
      current += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDates = [...byDate.keys()].sort();
  let best = 0;
  let running = 0;
  let prevDate: string | null = null;
  sortedDates.forEach((dateStr) => {
    const isDone = byDate.get(dateStr);
    if (isDone) {
      if (
        prevDate &&
        (new Date(dateStr).getTime() - new Date(prevDate).getTime()) / 86400000 === 1
      ) {
        running += 1;
      } else {
        running = 1;
      }
      best = Math.max(best, running);
      prevDate = dateStr;
    } else {
      running = 0;
    }
  });

  return { streak: current, bestStreak: Math.max(best, current) };
}

export function decorateHabit(habit: Habit, records: HabitRecord[]): HabitWithProgress {
  const { streak, bestStreak } = computeStreaks(habit.id, records);
  const todayRecord = records.find(
    (r) => r.habitId === habit.id && r.date === todayISO(),
  );
  const todayProgress = todayRecord?.progress ?? 0;
  return {
    id: habit.id,
    userId: habit.userId,
    name: habit.name,
    description: habit.description,
    category: habit.category,
    frequency: habit.frequency,
    priority: habit.priority,
    startDate: habit.startDate,
    endDate: habit.endDate,
    active: habit.active,
    createdAt: habit.createdAt.toISOString(),
    streak,
    bestStreak,
    todayProgress,
    completedToday: todayProgress >= 100,
  };
}
