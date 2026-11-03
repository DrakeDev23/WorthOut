import type { MuscleGroup, WorkoutSession } from '@/types/models';
import {
  WEEKDAY_LABELS,
  addDays,
  dayDiff,
  dayKeyFromDate,
  dayKeyFromISO,
  isSameMonth,
  sameDay,
  startOfWeek,
  weekdayIndex,
} from './date-utils';
import type {
  DayActivity,
  DurationTrendPoint,
  MonthActivity,
  MuscleDistributionSlice,
  ProgressTotals,
  WeekdayActivity,
} from './types';

export type MuscleGroupResolver = (exerciseId: string) => MuscleGroup | null | undefined;

function sessionSets(session: WorkoutSession): number {
  return session.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
}

function sessionReps(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.reduce((s, set) => s + (Number.isFinite(set.reps) ? set.reps : 0), 0),
    0
  );
}

export function totalWorkouts(history: WorkoutSession[]): number {
  return history.length;
}

export function totalSets(history: WorkoutSession[]): number {
  return history.reduce((sum, session) => sum + sessionSets(session), 0);
}

export function totalReps(history: WorkoutSession[]): number {
  return history.reduce((sum, session) => sum + sessionReps(session), 0);
}

export function totalMinutes(history: WorkoutSession[]): number {
  return history.reduce((sum, session) => sum + (session.durationMinutes ?? 0), 0);
}

export function computeTotals(history: WorkoutSession[]): ProgressTotals {
  return {
    totalWorkouts: totalWorkouts(history),
    totalSets: totalSets(history),
    totalReps: totalReps(history),
    totalMinutes: totalMinutes(history),
  };
}

export function groupByDay(history: WorkoutSession[]): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>();
  for (const session of history) {
    const key = dayKeyFromISO(session.date);
    const existing = map.get(key);
    if (existing) {
      existing.workouts += 1;
      existing.sets += sessionSets(session);
      existing.minutes += session.durationMinutes ?? 0;
    } else {
      map.set(key, {
        key,
        workouts: 1,
        sets: sessionSets(session),
        minutes: session.durationMinutes ?? 0,
      });
    }
  }
  return map;
}

export function sessionsInRange(
  history: WorkoutSession[],
  start: Date,
  end: Date
): WorkoutSession[] {
  return history.filter((session) => {
    const date = new Date(session.date);
    return dayDiff(date, start) >= 0 && dayDiff(end, date) >= 0;
  });
}

export function weeklyActivity(
  history: WorkoutSession[],
  reference: Date = new Date(),
  today: Date = new Date()
): WeekdayActivity[] {
  const weekStart = startOfWeek(reference);
  const byDay = groupByDay(history);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = addDays(weekStart, index);
    const activity = byDay.get(dayKeyFromDate(date));
    return {
      index,
      label,
      workouts: activity?.workouts ?? 0,
      minutes: activity?.minutes ?? 0,
      isToday: sameDay(date, today),
    };
  });
}

export function monthlyActivity(
  history: WorkoutSession[],
  reference: Date = new Date()
): MonthActivity {
  const inMonth = history.filter((session) => isSameMonth(new Date(session.date), reference));
  return {
    totalWorkouts: inMonth.length,
    totalSets: totalSets(inMonth),
    totalReps: totalReps(inMonth),
    totalMinutes: totalMinutes(inMonth),
  };
}

export function currentStreak(history: WorkoutSession[], today: Date = new Date()): number {
  if (history.length === 0) return 0;
  const days = new Set<string>();
  for (const session of history) days.add(dayKeyFromISO(session.date));

  let cursor = today;
  if (!days.has(dayKeyFromDate(cursor))) {
    const yesterday = addDays(today, -1);
    if (!days.has(dayKeyFromDate(yesterday))) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (days.has(dayKeyFromDate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function workoutDayCount(history: WorkoutSession[]): number {
  const days = new Set<string>();
  for (const session of history) days.add(dayKeyFromISO(session.date));
  return days.size;
}

export function weeklyDurationTrend(
  history: WorkoutSession[],
  reference: Date = new Date(),
  weeks: number = 6
): DurationTrendPoint[] {
  const currentWeekStart = startOfWeek(reference);
  const points: DurationTrendPoint[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const weekEnd = addDays(weekStart, 6);
    const sessions = sessionsInRange(history, weekStart, weekEnd);
    const minutes = sessions.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0);
    points.push({
      weekStart,
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      minutes,
      hasActivity: sessions.length > 0,
    });
  }
  return points;
}

export function safePercentChange(previous: number, current: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function muscleDistribution(
  history: WorkoutSession[],
  resolveMuscleGroup: MuscleGroupResolver
): MuscleDistributionSlice[] {
  const counts = new Map<MuscleGroup | 'Unknown', number>();
  let total = 0;

  for (const session of history) {
    for (const exercise of session.exercises) {
      const setCount = exercise.sets.length;
      if (setCount === 0) continue;
      const group = resolveMuscleGroup(exercise.exerciseId) ?? 'Unknown';
      counts.set(group, (counts.get(group) ?? 0) + setCount);
      total += setCount;
    }
  }

  const slices: MuscleDistributionSlice[] = [];
  for (const [muscleGroup, sets] of counts) {
    slices.push({ muscleGroup, sets, fraction: total > 0 ? sets / total : 0 });
  }

  slices.sort(
    (a, b) => b.sets - a.sets || String(a.muscleGroup).localeCompare(String(b.muscleGroup))
  );
  return slices;
}

export function sessionsOnDay(history: WorkoutSession[], day: Date): WorkoutSession[] {
  const key = dayKeyFromDate(day);
  return history
    .filter((session) => dayKeyFromISO(session.date) === key)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function hasWorkoutOn(history: WorkoutSession[], day: Date): boolean {
  const key = dayKeyFromDate(day);
  return history.some((session) => dayKeyFromISO(session.date) === key);
}

export { weekdayIndex };
