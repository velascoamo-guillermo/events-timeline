/**
 * Event System - Core Domain Models
 *
 * Defines the event types and schemas for the local-first event timeline.
 * All events follow a consistent structure for persistence and synchronization.
 */

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Domain Events - Business logic events
 */
export enum DomainEventType {
  ITEM_CREATED = "ITEM_CREATED",
  ITEM_UPDATED = "ITEM_UPDATED",
  ITEM_DELETED = "ITEM_DELETED",
}

/**
 * Sync Events - Synchronization process events
 */
export enum SyncEventType {
  SYNC_STARTED = "SYNC_STARTED",
  SYNC_SUCCESS = "SYNC_SUCCESS",
  SYNC_FAILED = "SYNC_FAILED",
  CONFLICT_DETECTED = "CONFLICT_DETECTED",
  CONFLICT_RESOLVED = "CONFLICT_RESOLVED",
}

/**
 * System Events - Application lifecycle and connectivity events
 */
export enum SystemEventType {
  APP_BACKGROUND = "APP_BACKGROUND",
  APP_FOREGROUND = "APP_FOREGROUND",
  NETWORK_ONLINE = "NETWORK_ONLINE",
  NETWORK_OFFLINE = "NETWORK_OFFLINE",
}

/**
 * All possible event types in the system
 */
export type EventType = DomainEventType | SyncEventType | SystemEventType;

/**
 * Sync status for each event
 */
export enum SyncStatus {
  PENDING = "pending", // Event created, waiting to sync
  SYNCED = "synced", // Successfully synced to remote
  FAILED = "failed", // Sync failed, will retry
}

// ============================================================================
// PAYLOAD TYPES
// ============================================================================

/**
 * Base payload interface - all payloads extend this
 */
export interface BasePayload {
  [key: string]: any;
}

/**
 * Item domain entity
 */
export interface Item {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Payload for ITEM_CREATED events
 */
export interface ItemCreatedPayload extends BasePayload {
  item: Item;
}

/**
 * Payload for ITEM_UPDATED events
 */
export interface ItemUpdatedPayload extends BasePayload {
  itemId: string;
  changes: Partial<Item>;
  previousValues: Partial<Item>;
}

/**
 * Payload for ITEM_DELETED events
 */
export interface ItemDeletedPayload extends BasePayload {
  itemId: string;
  deletedItem: Item;
}

/**
 * Payload for SYNC_STARTED events
 */
export interface SyncStartedPayload extends BasePayload {
  batchSize: number;
  startTime: number;
}

/**
 * Payload for SYNC_SUCCESS events
 */
export interface SyncSuccessPayload extends BasePayload {
  syncedCount: number;
  duration: number;
  endTime: number;
}

/**
 * Payload for SYNC_FAILED events
 */
export interface SyncFailedPayload extends BasePayload {
  error: string;
  errorCode?: string;
  retryCount: number;
  nextRetryAt?: number;
}

/**
 * Payload for CONFLICT_DETECTED events
 */
export interface ConflictDetectedPayload extends BasePayload {
  eventId: string;
  conflictType: "version" | "content" | "deletion";
  localData: any;
  remoteData: any;
}

/**
 * Payload for CONFLICT_RESOLVED events
 */
export interface ConflictResolvedPayload extends BasePayload {
  eventId: string;
  resolution: "local" | "remote" | "merged";
  resolvedData: any;
}

/**
 * Payload for APP_BACKGROUND events
 */
export interface AppBackgroundPayload extends BasePayload {
  timestamp: number;
}

/**
 * Payload for APP_FOREGROUND events
 */
export interface AppForegroundPayload extends BasePayload {
  timestamp: number;
  backgroundDuration: number;
}

/**
 * Payload for NETWORK_ONLINE events
 */
export interface NetworkOnlinePayload extends BasePayload {
  timestamp: number;
  connectionType?: "wifi" | "cellular" | "unknown";
}

/**
 * Payload for NETWORK_OFFLINE events
 */
export interface NetworkOfflinePayload extends BasePayload {
  timestamp: number;
}

/**
 * Union of all payload types
 */
export type EventPayload =
  | ItemCreatedPayload
  | ItemUpdatedPayload
  | ItemDeletedPayload
  | SyncStartedPayload
  | SyncSuccessPayload
  | SyncFailedPayload
  | ConflictDetectedPayload
  | ConflictResolvedPayload
  | AppBackgroundPayload
  | AppForegroundPayload
  | NetworkOnlinePayload
  | NetworkOfflinePayload
  | BasePayload;

// ============================================================================
// EVENT MODEL
// ============================================================================

/**
 * Core Event model
 *
 * All events in the system follow this structure:
 * - Unique identifier
 * - Type classification
 * - Payload with event-specific data
 * - Timestamp for chronological ordering
 * - Sync status for remote synchronization
 * - Audit timestamps
 * - Optional error information
 */
export interface Event {
  /**
   * Unique event identifier (UUID v4)
   */
  id: string;

  /**
   * Event type classification
   */
  type: EventType;

  /**
   * Event-specific data payload
   */
  payload: EventPayload;

  /**
   * When the event occurred (Unix timestamp in ms)
   */
  timestamp: number;

  /**
   * Current sync status
   */
  status: SyncStatus;

  /**
   * When the event was created locally (Unix timestamp in ms)
   */
  createdAt: number;

  /**
   * When the event was successfully synced (Unix timestamp in ms)
   * Undefined if not yet synced
   */
  syncedAt?: number;

  /**
   * Error message if sync failed
   * Undefined if no error
   */
  error?: string;

  /**
   * Number of sync retry attempts
   */
  retryCount?: number;

  /**
   * Device/client identifier for conflict resolution
   */
  deviceId?: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for domain events
 */
export function isDomainEvent(type: EventType): type is DomainEventType {
  return Object.values(DomainEventType).includes(type as DomainEventType);
}

/**
 * Type guard for sync events
 */
export function isSyncEvent(type: EventType): type is SyncEventType {
  return Object.values(SyncEventType).includes(type as SyncEventType);
}

/**
 * Type guard for system events
 */
export function isSystemEvent(type: EventType): type is SystemEventType {
  return Object.values(SystemEventType).includes(type as SystemEventType);
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Event creation input (before persistence)
 */
export interface CreateEventInput {
  type: EventType;
  payload: EventPayload;
  timestamp?: number; // Optional, defaults to Date.now()
  deviceId?: string;
}

/**
 * Event filter options for queries
 */
export interface EventFilter {
  types?: EventType[];
  status?: SyncStatus[];
  startDate?: number;
  endDate?: number;
  searchText?: string;
}

/**
 * Event grouping by date
 */
export interface EventGroup {
  date: string; // ISO date string (YYYY-MM-DD)
  events: Event[];
  count: number;
}

/**
 * Event statistics
 */
export interface EventStats {
  total: number;
  byType: Record<EventType, number>;
  byStatus: Record<SyncStatus, number>;
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
}
