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
  createEventBatch(inputs: CreateEventInput[]): Promise<Event[]> {
    throw new Error("Method not implemented.");
  }
  getEventById(id: string): Promise<Event | null> {
    throw new Error("Method not implemented.");
  }
  getAllEvents(limit?: number, offset?: number): Promise<Event[]> {
    throw new Error("Method not implemented.");
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
  countEvents(filter?: EventFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  updateEventStatus(
    id: string,
    status: SyncStatus,
    options?: { syncedAt?: number; error?: string; retryCount?: number }
  ): Promise<Event> {
    throw new Error("Method not implemented.");
  }
  updateEventStatusBatch(
    updates: Array<{
      id: string;
      status: SyncStatus;
      syncedAt?: number;
      error?: string;
      retryCount?: number;
    }>
  ): Promise<Event[]> {
    throw new Error("Method not implemented.");
  }
  deleteEvent(id: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  deleteEvents(ids: string[]): Promise<number> {
    throw new Error("Method not implemented.");
  }
  deleteEventsByFilter(filter: EventFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  clearAllEvents(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPendingEvents(limit?: number): Promise<Event[]> {
    throw new Error("Method not implemented.");
  }
  getFailedEvents(limit?: number): Promise<Event[]> {
    throw new Error("Method not implemented.");
  }
  markEventsSynced(ids: string[], syncedAt?: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
  markEventsFailed(
    updates: Array<{ id: string; error: string; retryCount: number }>
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  subscribeToEvents(
    callback: (events: Event[]) => void,
    filter?: EventFilter
  ): () => void {
    throw new Error("Method not implemented.");
  }
  subscribeToStats(callback: (stats: EventStats) => void): () => void {
    throw new Error("Method not implemented.");
  }
  initialize(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  healthCheck(): Promise<{
    healthy: boolean;
    eventCount: number;
    pendingCount: number;
    lastError?: string;
  }> {
    throw new Error("Method not implemented.");
  }
  async createEvent(input: CreateEventInput): Promise<Event> {
    const event = await database.write(async () => {
      return await database.collections
        .get<EventModel>("events")
        .create((record) => {
          record.type = input.type;
          record.payloadRaw = JSON.stringify(input.payload);
          record.timestamp = input.timestamp || Date.now();
          record.status = SyncStatusEnum.PENDING;
          record.deviceId = input.deviceId;
        });
    });

    return this.mapToEvent(event);
  }

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

  // ... resto de métodos de IEventStore
}
