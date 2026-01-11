/**
 * Event Batch Writer - Native Module Interface
 *
 * High-performance native module for batch event persistence.
 * Implemented in Swift (iOS) and Kotlin (Android) using Expo Modules API.
 *
 * Why Native?
 * - High throughput scenarios (1000+ events/sec)
 * - Background thread execution
 * - Efficient disk I/O
 * - Minimize JS bridge overhead
 * - Battery-efficient background writes
 *
 * Use Cases:
 * - Bulk event generation (e.g., import, migration)
 * - Background sync completion
 * - App state restoration
 * - Performance-critical logging
 */

import type { CreateEventInput } from "../../domain/models/Event";

// ============================================================================
// BATCH WRITE OPTIONS
// ============================================================================

/**
 * Batch write configuration
 */
export interface BatchWriteOptions {
  /**
   * Write priority
   * - high: Execute immediately
   * - normal: Execute in next flush cycle
   * - low: Execute when idle
   */
  priority?: "high" | "normal" | "low";

  /**
   * Execute write on background thread
   * @default true
   */
  background?: boolean;

  /**
   * Flush immediately after write
   * Forces disk sync (slower but safer)
   * @default false
   */
  flushImmediately?: boolean;

  /**
   * Transaction mode
   * - auto: Let the module decide
   * - single: Single transaction for all events
   * - individual: Individual transactions (slower, more granular rollback)
   * @default 'single'
   */
  transactionMode?: "auto" | "single" | "individual";
}

/**
 * Batch write result
 */
export interface BatchWriteResult {
  /**
   * Write was successful
   */
  success: boolean;

  /**
   * Number of events written
   */
  writtenCount: number;

  /**
   * Write duration in milliseconds
   */
  duration: number;

  /**
   * Bytes written to disk
   */
  bytesWritten?: number;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * IDs of successfully written events
   */
  eventIds: string[];
}

// ============================================================================
// BATCH WRITER STATE
// ============================================================================

/**
 * Current state of the batch writer
 */
export interface BatchWriterState {
  /**
   * Is writer initialized and ready
   */
  ready: boolean;

  /**
   * Number of pending writes in queue
   */
  pendingWrites: number;

  /**
   * Total events written since initialization
   */
  totalWritten: number;

  /**
   * Total write errors since initialization
   */
  totalErrors: number;

  /**
   * Current queue size in bytes
   */
  queueSizeBytes: number;

  /**
   * Last write timestamp
   */
  lastWriteAt?: number;

  /**
   * Last error timestamp
   */
  lastErrorAt?: number;

  /**
   * Last error message
   */
  lastError?: string;
}

/**
 * Batch writer statistics
 */
export interface BatchWriterStats {
  totalWrites: number;
  totalEvents: number;
  totalErrors: number;
  averageWriteDuration: number;
  averageBatchSize: number;
  totalBytesWritten: number;
}

// ============================================================================
// NATIVE MODULE INTERFACE
// ============================================================================

/**
 * Event Batch Writer native module interface
 *
 * This interface is implemented in native code (Swift/Kotlin)
 * and exposed to JavaScript via Expo Modules API.
 */
export interface IEventBatchWriter {
  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the batch writer
   * Must be called before any write operations
   *
   * @param databasePath Path to SQLite database
   * @param options Initialization options
   */
  initialize(
    databasePath: string,
    options?: {
      maxQueueSize?: number;
      flushInterval?: number;
      enableBackgroundWrites?: boolean;
    }
  ): Promise<void>;

  /**
   * Shutdown the batch writer
   * Flushes pending writes and releases resources
   */
  shutdown(): Promise<void>;

  // ============================================================================
  // WRITE OPERATIONS
  // ============================================================================

  /**
   * Write a batch of events
   * This is the primary method for high-performance writes
   *
   * @param events Events to write
   * @param options Write options
   * @returns Write result with timing and success info
   */
  writeBatch(
    events: CreateEventInput[],
    options?: BatchWriteOptions
  ): Promise<BatchWriteResult>;

  /**
   * Write a single event
   * Convenience method, internally uses writeBatch
   *
   * @param event Event to write
   * @param options Write options
   * @returns Write result
   */
  writeEvent(
    event: CreateEventInput,
    options?: BatchWriteOptions
  ): Promise<BatchWriteResult>;

  /**
   * Flush all pending writes to disk
   * Forces immediate write of queued events
   *
   * @returns Number of events flushed
   */
  flush(): Promise<number>;

  // ============================================================================
  // STATE & MONITORING
  // ============================================================================

  /**
   * Get current writer state
   */
  getState(): Promise<BatchWriterState>;

  /**
   * Get writer statistics
   */
  getStats(): Promise<BatchWriterStats>;

  /**
   * Reset statistics
   */
  resetStats(): Promise<void>;

  /**
   * Check if writer is ready
   */
  isReady(): Promise<boolean>;

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Set maximum queue size in bytes
   * When queue exceeds this, oldest writes are flushed
   */
  setMaxQueueSize(sizeBytes: number): Promise<void>;

  /**
   * Set flush interval in milliseconds
   * Automatic flush of pending writes
   */
  setFlushInterval(intervalMs: number): Promise<void>;

  /**
   * Enable or disable background writes
   */
  setBackgroundWrites(enabled: boolean): Promise<void>;

  // ============================================================================
  // EVENT LISTENERS (Native → JS)
  // ============================================================================

  /**
   * Add listener for write completion
   * Called from native thread when write finishes
   */
  addWriteCompleteListener(
    callback: (result: BatchWriteResult) => void
  ): () => void;

  /**
   * Add listener for write errors
   * Called from native thread when write fails
   */
  addWriteErrorListener(
    callback: (error: { message: string; timestamp: number }) => void
  ): () => void;

  /**
   * Add listener for queue overflow
   * Called when queue exceeds max size
   */
  addQueueOverflowListener(callback: (queueSize: number) => void): () => void;
}

// ============================================================================
// NATIVE MODULE CONSTANTS
// ============================================================================

/**
 * Constants from native module
 */
export interface EventBatchWriterConstants {
  /**
   * Maximum batch size supported by native module
   */
  MAX_BATCH_SIZE: number;

  /**
   * Default flush interval in milliseconds
   */
  DEFAULT_FLUSH_INTERVAL: number;

  /**
   * Default max queue size in bytes
   */
  DEFAULT_MAX_QUEUE_SIZE: number;

  /**
   * Native module version
   */
  VERSION: string;

  /**
   * Platform (ios | android)
   */
  PLATFORM: "ios" | "android";
}

// ============================================================================
// FACTORY & SINGLETON
// ============================================================================

/**
 * Get the native event batch writer module
 * Singleton instance
 */
export function getEventBatchWriter(): IEventBatchWriter {
  // In implementation, this will require the native module:
  // return requireNativeModule('EventBatchWriter');
  throw new Error("EventBatchWriter native module not yet implemented");
}

/**
 * Type guard to check if native module is available
 */
export function isEventBatchWriterAvailable(): boolean {
  try {
    getEventBatchWriter();
    return true;
  } catch {
    return false;
  }
}
