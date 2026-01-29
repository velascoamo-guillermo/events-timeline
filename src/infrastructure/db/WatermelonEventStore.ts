import { Q } from "@nozbe/watermelondb";
import * as Crypto from "expo-crypto";
import type {
  CreateEventInput,
  Event,
  EventFilter,
  EventGroup,
  EventStats,
  SyncStatus,
} from "../../domain/models/Event";
import { SyncStatus as SyncStatusEnum } from "../../domain/models/Event";
import type { IEventStore } from "../../domain/store/EventStore";
import { database } from "./database";
import { EventModel } from "./EventModel";

export class WatermelonEventStore implements IEventStore {
  // ============================================================================
  // CREATE
  // ============================================================================

  async createEvent(input: CreateEventInput): Promise<Event> {
    const event = await database.write(async () => {
      const collection = database.collections.get<EventModel>("events");
      return await collection.create((record) => {
        // Use UUID for Supabase compatibility
        record._raw.id = Crypto.randomUUID();
        record.type = input.type;
        record.payloadRaw = JSON.stringify(input.payload);
        record.timestamp = input.timestamp || Date.now();
        record.status = SyncStatusEnum.PENDING;
        record.deviceId = input.deviceId;
      });
    });

    return this.mapToEvent(event);
  }

  async createEventBatch(inputs: CreateEventInput[]): Promise<Event[]> {
    const events = await database.write(async () => {
      const collection = database.collections.get<EventModel>("events");
      return await Promise.all(
        inputs.map((input) =>
          collection.create((record) => {
            record._raw.id = Crypto.randomUUID();
            record.type = input.type;
            record.payloadRaw = JSON.stringify(input.payload);
            record.timestamp = input.timestamp || Date.now();
            record.status = SyncStatusEnum.PENDING;
            record.deviceId = input.deviceId;
          })
        )
      );
    });

    return events.map((e) => this.mapToEvent(e));
  }

  // ============================================================================
  // READ
  // ============================================================================

  async getEventById(id: string): Promise<Event | null> {
    try {
      const event = await database.collections
        .get<EventModel>("events")
        .find(id);
      return this.mapToEvent(event);
    } catch (error) {
      // WatermelonDB throws if not found
      return null;
    }
  }

  async getAllEvents(limit?: number, offset?: number): Promise<Event[]> {
    const collection = database.collections.get<EventModel>("events");
    let query = collection.query();

    if (limit !== undefined) {
      if (offset !== undefined) {
        query = collection.query(Q.take(limit), Q.skip(offset));
      } else {
        query = collection.query(Q.take(limit));
      }
    }

    const events = await query;
    return events.map((e) => this.mapToEvent(e));
  }

  async countEvents(filter?: EventFilter): Promise<number> {
    const collection = database.collections.get<EventModel>("events");
    const query = this.buildQuery(collection, filter);
    const events = await query;
    return events.length;
  }

  async getPendingEvents(limit?: number): Promise<Event[]> {
    const collection = database.collections.get<EventModel>("events");

    let query = collection.query(Q.where("status", SyncStatusEnum.PENDING));

    if (limit !== undefined) {
      const events = await query.fetch();
      return events.slice(0, limit).map((e) => this.mapToEvent(e));
    }

    const events = await query;
    return events.map((e) => this.mapToEvent(e));
  }

  async getFailedEvents(limit?: number): Promise<Event[]> {
    const collection = database.collections.get<EventModel>("events");

    let query = collection.query(Q.where("status", SyncStatusEnum.FAILED));

    if (limit !== undefined) {
      const events = await query.fetch();
      return events.slice(0, limit).map((e) => this.mapToEvent(e));
    }

    const events = await query;
    return events.map((e) => this.mapToEvent(e));
  }

  queryEvents(
    filter: EventFilter,
    limit?: number,
    offset?: number
  ): Promise<Event[]> {
    throw new Error("Method not implemented.");
  }

  getEventsByDate(filter?: EventFilter): Promise<EventGroup[]> {
    throw new Error("Method not implemented.");
  }

  getEventStats(filter?: EventFilter): Promise<EventStats> {
    throw new Error("Method not implemented.");
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  async updateEventStatus(
    id: string,
    status: SyncStatus,
    options?: { syncedAt?: number; error?: string; retryCount?: number }
  ): Promise<Event> {
    const event = await database.write(async () => {
      const record = await database.collections
        .get<EventModel>("events")
        .find(id);

      return await record.update((r) => {
        r.status = status;
        if (options?.syncedAt !== undefined) {
          r.syncedAt = new Date(options.syncedAt);
        }
        if (options?.error !== undefined) {
          r.error = options.error;
        }
        if (options?.retryCount !== undefined) {
          r.retryCount = options.retryCount;
        }
      });
    });

    return this.mapToEvent(event);
  }

  async updateEventStatusBatch(
    updates: Array<{
      id: string;
      status: SyncStatus;
      syncedAt?: number;
      error?: string;
      retryCount?: number;
    }>
  ): Promise<Event[]> {
    const events = await database.write(async () => {
      const collection = database.collections.get<EventModel>("events");
      return await Promise.all(
        updates.map(async (update) => {
          const record = await collection.find(update.id);
          return await record.update((r) => {
            r.status = update.status;
            if (update.syncedAt !== undefined) {
              r.syncedAt = new Date(update.syncedAt);
            }
            if (update.error !== undefined) {
              r.error = update.error;
            }
            if (update.retryCount !== undefined) {
              r.retryCount = update.retryCount;
            }
          });
        })
      );
    });

    return events.map((e) => this.mapToEvent(e));
  }

  async markEventsSynced(ids: string[], syncedAt?: number): Promise<void> {
    await database.write(async () => {
      const collection = database.collections.get<EventModel>("events");
      await Promise.all(
        ids.map(async (id) => {
          const record = await collection.find(id);
          await record.update((r) => {
            r.status = SyncStatusEnum.SYNCED;
            r.syncedAt = new Date(syncedAt || Date.now());
          });
        })
      );
    });
  }

  async markEventsFailed(
    updates: Array<{ id: string; error: string; retryCount: number }>
  ): Promise<void> {
    await database.write(async () => {
      const collection = database.collections.get<EventModel>("events");
      await Promise.all(
        updates.map(async ({ id, error, retryCount }) => {
          const record = await collection.find(id);
          await record.update((r) => {
            r.status = SyncStatusEnum.FAILED;
            r.error = error;
            r.retryCount = retryCount;
          });
        })
      );
    });
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  async deleteEvent(id: string): Promise<boolean> {
    try {
      await database.write(async () => {
        const event = await database.collections
          .get<EventModel>("events")
          .find(id);
        await event.markAsDeleted();
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async deleteEvents(ids: string[]): Promise<number> {
    let deletedCount = 0;
    await database.write(async () => {
      const collection = database.collections.get<EventModel>("events");
      for (const id of ids) {
        try {
          const event = await collection.find(id);
          await event.markAsDeleted();
          deletedCount++;
        } catch {
          // Event not found, skip
        }
      }
    });
    return deletedCount;
  }

  async clearAllEvents(): Promise<void> {
    await database.write(async () => {
      const events = await database.collections
        .get<EventModel>("events")
        .query()
        .fetch();
      await Promise.all(events.map((e) => e.markAsDeleted()));
    });
  }

  deleteEventsByFilter(filter: EventFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }

  // ============================================================================
  // SUBSCRIPTIONS (placeholder)
  // ============================================================================

  subscribeToEvents(
    callback: (events: Event[]) => void,
    filter?: EventFilter
  ): () => void {
    throw new Error("Method not implemented.");
  }

  subscribeToStats(callback: (stats: EventStats) => void): () => void {
    throw new Error("Method not implemented.");
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  async initialize(): Promise<void> {
    // Database is already initialized in database.ts
    return Promise.resolve();
  }

  async close(): Promise<void> {
    // WatermelonDB doesn't require explicit close
    return Promise.resolve();
  }

  async healthCheck(): Promise<{
    healthy: boolean;
    eventCount: number;
    pendingCount: number;
    lastError?: string;
  }> {
    try {
      const eventCount = await this.countEvents();
      const pendingCount = (await this.getPendingEvents()).length;
      return {
        healthy: true,
        eventCount,
        pendingCount,
      };
    } catch (error) {
      return {
        healthy: false,
        eventCount: 0,
        pendingCount: 0,
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private mapToEvent(model: EventModel): Event {
    return {
      id: model.id,
      type: model.type,
      payload: model.payload,
      timestamp: model.timestamp,
      status: model.status,
      createdAt: model.createdAt.getTime(),
      syncedAt: model.syncedAt?.getTime(),
      error: model.error,
      retryCount: model.retryCount,
      deviceId: model.deviceId,
    };
  }

  private buildQuery(collection: any, filter?: EventFilter): any {
    // TODO: Implement complex filtering with Q.and, Q.or, etc.
    return collection.query();
  }
}
