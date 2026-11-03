import { asc, desc, eq, gte, inArray } from 'drizzle-orm';

import { db as defaultDb } from '@/database/client';
import type { DrizzleDatabase } from '@/database/db-types';
import { toWorkoutSession } from '@/database/mappers';
import {
  workoutHistory,
  workoutHistoryExercises,
  workoutHistorySets,
  type WorkoutHistoryRow,
  type WorkoutHistorySetRow,
} from '@/database/schema';
import type { WorkoutSession } from '@/types/models';

export class HistoryRepository {
  constructor(private readonly db: DrizzleDatabase = defaultDb) {}

  async getAll(): Promise<WorkoutSession[]> {
    const headers = await this.db.select().from(workoutHistory).orderBy(desc(workoutHistory.date));
    return this.hydrate(headers);
  }

  async getById(sessionId: string): Promise<WorkoutSession | undefined> {
    const [header] = await this.db
      .select()
      .from(workoutHistory)
      .where(eq(workoutHistory.id, sessionId))
      .limit(1);
    if (!header) return undefined;
    const [session] = await this.hydrate([header]);
    return session;
  }

  async getByDateRange(startIso: string, endIso: string): Promise<WorkoutSession[]> {
    const headers = await this.db
      .select()
      .from(workoutHistory)
      .where(gte(workoutHistory.date, startIso))
      .orderBy(desc(workoutHistory.date));
    const filtered = headers.filter((h) => h.date <= endIso);
    return this.hydrate(filtered);
  }

  async saveCompletedWorkout(session: WorkoutSession): Promise<boolean> {
    const [existing] = await this.db
      .select({ id: workoutHistory.id })
      .from(workoutHistory)
      .where(eq(workoutHistory.id, session.id))
      .limit(1);
    if (existing) return false;

    this.db.transaction((tx) => {
      tx.insert(workoutHistory)
        .values({
          id: session.id,
          routineId: session.routineId || null,
          routineNameSnapshot: session.routineName,
          date: session.date,
          durationMinutes: session.durationMinutes,
          totalSets: session.totalSets,
        })
        .run();

      session.exercises.forEach((exercise, exIndex) => {
        const exerciseRowId = `${session.id}-ex-${exIndex}`;
        tx.insert(workoutHistoryExercises)
          .values({
            id: exerciseRowId,
            sessionId: session.id,
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            position: exIndex,
          })
          .run();

        exercise.sets.forEach((set, setIndex) => {
          tx.insert(workoutHistorySets)
            .values({
              id: `${exerciseRowId}-set-${setIndex}`,
              exerciseRef: exerciseRowId,
              position: setIndex,
              reps: set.reps,
              weightKg: set.weightKg ?? null,
              durationSeconds: set.durationSeconds ?? null,
            })
            .run();
        });
      });
    });
    return true;
  }

  private async hydrate(headers: WorkoutHistoryRow[]): Promise<WorkoutSession[]> {
    if (headers.length === 0) return [];
    const sessionIds = headers.map((h) => h.id);

    const exerciseRows = await this.db
      .select()
      .from(workoutHistoryExercises)
      .where(inArray(workoutHistoryExercises.sessionId, sessionIds))
      .orderBy(asc(workoutHistoryExercises.position));

    const exerciseIds = exerciseRows.map((e) => e.id);
    const setRows: WorkoutHistorySetRow[] = exerciseIds.length
      ? await this.db
          .select()
          .from(workoutHistorySets)
          .where(inArray(workoutHistorySets.exerciseRef, exerciseIds))
          .orderBy(asc(workoutHistorySets.position))
      : [];

    const exercisesBySession = new Map<string, typeof exerciseRows>();
    for (const row of exerciseRows) {
      const list = exercisesBySession.get(row.sessionId) ?? [];
      list.push(row);
      exercisesBySession.set(row.sessionId, list);
    }

    const setsByExercise = new Map<string, WorkoutHistorySetRow[]>();
    for (const row of setRows) {
      const list = setsByExercise.get(row.exerciseRef) ?? [];
      list.push(row);
      setsByExercise.set(row.exerciseRef, list);
    }

    return headers.map((header) =>
      toWorkoutSession(header, exercisesBySession.get(header.id) ?? [], setsByExercise)
    );
  }
}

export const historyRepository = new HistoryRepository();
