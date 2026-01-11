/**
 * Event Store Interface
 *
 * Repository pattern for event persistence and retrieval.
 * Abstracts the underlying database implementation.
 *
 * This interface will be implemented by:
 * - SQLiteEventStore (direct SQLite)
 * - WatermelonEventStore (WatermelonDB)
 * - MemoryEventStore (testing)
 */

import type {
  CreateEventInput,
  Event,
  EventFilter,
  EventGroup,
  EventStats,
  SyncStatus,
} from "../models/Event";

/**
 * Core event store operations
 */
export interface IEventStore {
  // ============================================================================
  // CREATE
  // ============================================================================

  /**
   * Create a single event
   * @returns The created event with generated ID and timestamps
   */
  createEvent(input: CreateEventInput): Promise<Event>;

  /**
   * Create multiple events in a batch
   * Optimized for high-throughput scenarios
   * @returns Array of created events
   */
  createEventBatch(inputs: CreateEventInput[]): Promise<Event[]>;

  // ============================================================================
  // READ
  // ============================================================================

  /**
   * Get a single event by ID
   * @returns The event or null if not found
   */
  getEventById(id: string): Promise<Event | null>;

  /**
   * Get all events (use with caution on large datasets)
   * @param limit Maximum number of events to return
   * @param offset Pagination offset
   */
  getAllEvents(limit?: number, offset?: number): Promise<Event[]>;

  /**
   * Query events with filters
   * @param filter Filter criteria
   * @param limit Maximum number of events to return
   * @param offset Pagination offset
   */
  queryEvents(
    filter: EventFilter,
    limit?: number,
    offset?: number
  ): Promise<Event[]>;

  /**
   * Get events grouped by date
   * @param filter Optional filter criteria
   * @returns Array of event groups by date
   */
  getEventsByDate(filter?: EventFilter): Promise<EventGroup[]>;

  /**
   * Get event statistics
   * @param filter Optional filter criteria
   */
  getEventStats(filter?: EventFilter): Promise<EventStats>;

  /**
   * Count total events matching filter
   */
  countEvents(filter?: EventFilter): Promise<number>;

  // ============================================================================
  // UPDATE
  // ============================================================================

  /**
   * Update an event's sync status
   */
  updateEventStatus(
    id: string,
    status: SyncStatus,
    options?: {
      syncedAt?: number;
      error?: string;
      retryCount?: number;
    }
  ): Promise<Event>;

  /**
   * Update multiple events' sync status in batch
   */
  updateEventStatusBatch(
    updates: Array<{
      id: string;
      status: SyncStatus;
      syncedAt?: number;
      error?: string;
      retryCount?: number;
    }>
  ): Promise<Event[]>;

  // ============================================================================
  // DELETE
  // ============================================================================

  /**
   * Delete a single event by ID
   * @returns true if deleted, false if not found
   */
  deleteEvent(id: string): Promise<boolean>;

  /**
   * Delete multiple events by IDs
   * @returns Number of events deleted
   */
  deleteEvents(ids: string[]): Promise<number>;

  /**
   * Delete events matching filter
   * @returns Number of events deleted
   */
  deleteEventsByFilter(filter: EventFilter): Promise<number>;

  /**
   * Clear all events (dangerous!)
   */
  clearAllEvents(): Promise<void>;

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  /**
   * Get all pending events that need to be synced
   * @param limit Maximum number to return
   */
  getPendingEvents(limit?: number): Promise<Event[]>;

  /**
   * Get all failed events that need retry
   * @param limit Maximum number to return
   */
  getFailedEvents(limit?: number): Promise<Event[]>;

  /**
   * Mark events as synced
   */
  markEventsSynced(ids: string[], syncedAt?: number): Promise<void>;

  /**
   * Mark events as failed
   */
  markEventsFailed(
    updates: Array<{ id: string; error: string; retryCount: number }>
  ): Promise<void>;

  // ============================================================================
  // OBSERVABLES / SUBSCRIPTIONS (for reactive UIs)
  // ============================================================================

  /**
   * Subscribe to event changes
   * @param callback Called when events change
   * @returns Unsubscribe function
   */
  subscribeToEvents(
    callback: (events: Event[]) => void,
    filter?: EventFilter
  ): () => void;

  /**
   * Subscribe to event stats changes
   * @param callback Called when stats change
   * @returns Unsubscribe function
   */
  subscribeToStats(callback: (stats: EventStats) => void): () => void;

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Initialize the store (create tables, run migrations, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Close the store and cleanup resources
   */
  close(): Promise<void>;

  /**
   * Get store health status
   */
  healthCheck(): Promise<{
    healthy: boolean;
    eventCount: number;
    pendingCount: number;
    lastError?: string;
  }>;
}

/**
 * Event store configuration
 */
export interface EventStoreConfig {
  /**
   * Database name or path
   */
  databaseName: string;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Batch size for bulk operations
   */
  batchSize?: number;

  /**
   * Enable auto-vacuum
   */
  autoVacuum?: boolean;

  /**
   * Maximum retry count for failed syncs
   */
  maxRetryCount?: number;
}

/**
 * Event store factory function type
 */
export type EventStoreFactory = (
  config: EventStoreConfig
) => Promise<IEventStore>;
