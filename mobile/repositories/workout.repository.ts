import { eq } from 'drizzle-orm';

import { db as defaultDb } from '@/database/client';
import { LEGACY_LOCAL_ACCOUNT_ID } from '@/database/ids';
import type { DrizzleDatabase } from '@/database/db-types';
import { ACTIVE_SESSION_ID, activeSession } from '@/database/schema';
import type { ActiveWorkout } from '@/types/workout';

export class WorkoutRepository {
  constructor(private readonly db: DrizzleDatabase = defaultDb, private readonly accountId = LEGACY_LOCAL_ACCOUNT_ID) {}

  private get activeId(): string {
    return `${this.accountId}:${ACTIVE_SESSION_ID}`;
  }

  async saveActiveSession(
    workout: ActiveWorkout,
    updatedAt: string = new Date().toISOString()
  ): Promise<void> {
    const payload = JSON.stringify(workout);
    await this.db
      .insert(activeSession)
      .values({ id: this.activeId, accountId: this.accountId, payload, updatedAt })
      .onConflictDoUpdate({
        target: activeSession.id,
        set: { accountId: this.accountId, payload, updatedAt },
      });
  }

  async updateActiveSession(workout: ActiveWorkout, updatedAt?: string): Promise<void> {
    return this.saveActiveSession(workout, updatedAt);
  }

  async getActiveSession(): Promise<ActiveWorkout | null> {
    const [row] = await this.db
      .select()
      .from(activeSession)
      .where(eq(activeSession.id, this.activeId))
      .limit(1);
    if (!row) return null;
    try {
      return JSON.parse(row.payload) as ActiveWorkout;
    } catch {
      await this.deleteActiveSession();
      return null;
    }
  }

  async deleteActiveSession(): Promise<void> {
    await this.db.delete(activeSession).where(eq(activeSession.id, this.activeId));
  }
}

export const workoutRepository = new WorkoutRepository();
