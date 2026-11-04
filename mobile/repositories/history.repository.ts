import { and, asc, desc, eq, gte, inArray, isNull } from 'drizzle-orm';

import { db as defaultDb } from '@/database/client';
import { LEGACY_LOCAL_ACCOUNT_ID, uuidV4 } from '@/database/ids';
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
  constructor(private readonly db: DrizzleDatabase = defaultDb, private readonly accountId = LEGACY_LOCAL_ACCOUNT_ID) {}

  async getAll(): Promise<WorkoutSession[]> {
    const headers = await this.db.select().from(workoutHistory).where(and(eq(workoutHistory.accountId, this.accountId), isNull(workoutHistory.deletedAt))).orderBy(desc(workoutHistory.date));
    return this.hydrate(headers);
  }

  async getById(sessionId: string): Promise<WorkoutSession | undefined> {
    const [header] = await this.db
      .select()
      .from(workoutHistory)
      .where(and(eq(workoutHistory.id, sessionId), eq(workoutHistory.accountId, this.accountId), isNull(workoutHistory.deletedAt)))
      .limit(1);
    if (!header) return undefined;
    const [session] = await this.hydrate([header]);
    return session;
  }

  async getByDateRange(startIso: string, endIso: string): Promise<WorkoutSession[]> {
    const headers = await this.db
      .select()
      .from(workoutHistory)
      .where(and(gte(workoutHistory.date, startIso), eq(workoutHistory.accountId, this.accountId), isNull(workoutHistory.deletedAt)))
      .orderBy(desc(workoutHistory.date));
    const filtered = headers.filter((h) => h.date <= endIso);
    return this.hydrate(filtered);
  }

  async saveCompletedWorkout(session: WorkoutSession): Promise<boolean> {
    const [existing] = await this.db
      .select({ id: workoutHistory.id })
      .from(workoutHistory)
      .where(and(eq(workoutHistory.id, session.id), eq(workoutHistory.accountId, this.accountId)))
      .limit(1);
    if (existing) return false;

    this.db.transaction((tx) => {
      tx.insert(workoutHistory)
        .values({
          id: session.id,
          accountId: this.accountId,
          routineId: session.routineId || null,
          routineNameSnapshot: session.routineName,
          date: session.date,
          durationMinutes: session.durationMinutes,
          totalSets: session.totalSets,
          syncStatus: 'pending_insert',
          clientUpdatedAt: session.date,
        })
        .run();

      session.exercises.forEach((exercise, exIndex) => {
        const exerciseRowId = uuidV4();
        tx.insert(workoutHistoryExercises)
          .values({
            id: exerciseRowId,
            sessionId: session.id,
            accountId: this.accountId,
            exerciseId: exercise.exerciseId,
            name: exercise.name,
            position: exIndex,
            syncStatus: 'pending_insert',
            clientUpdatedAt: session.date,
          })
          .run();

        exercise.sets.forEach((set, setIndex) => {
          tx.insert(workoutHistorySets)
            .values({
              id: uuidV4(),
              accountId: this.accountId,
              exerciseRef: exerciseRowId,
              position: setIndex,
              reps: set.reps,
              weightKg: set.weightKg ?? null,
              durationSeconds: set.durationSeconds ?? null,
              syncStatus: 'pending_insert',
              clientUpdatedAt: session.date,
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
      .where(and(inArray(workoutHistoryExercises.sessionId, sessionIds), eq(workoutHistoryExercises.accountId, this.accountId), isNull(workoutHistoryExercises.deletedAt)))
      .orderBy(asc(workoutHistoryExercises.position));

    const exerciseIds = exerciseRows.map((e) => e.id);
    const setRows: WorkoutHistorySetRow[] = exerciseIds.length
      ? await this.db
          .select()
          .from(workoutHistorySets)
          .where(and(inArray(workoutHistorySets.exerciseRef, exerciseIds), eq(workoutHistorySets.accountId, this.accountId), isNull(workoutHistorySets.deletedAt)))
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
