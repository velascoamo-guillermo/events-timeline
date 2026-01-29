import type { Event } from "@/src/domain/models/Event";
import type { IRemoteEventAPI } from "@/src/infrastructure/sync/SyncEngine";
import { supabase, isSupabaseConfigured, type EventRow, type EventInsert } from "./supabase";

const log = (message: string, data?: unknown) => {
  if (__DEV__) {
    console.log(`[SupabaseEventAPI] ${message}`, data ?? "");
  }
};

export class SupabaseEventAPI implements IRemoteEventAPI {
  async pushEvents(events: Event[]): Promise<{
    success: boolean;
    syncedIds: string[];
    conflicts: Array<{
      eventId: string;
      remoteEvent: Event;
    }>;
    errors: Array<{
      eventId: string;
      error: string;
    }>;
  }> {
    log(`pushEvents called with ${events.length} events`);

    if (!isSupabaseConfigured()) {
      log("Supabase is not configured - check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY");
      return {
        success: false,
        syncedIds: [],
        conflicts: [],
        errors: events.map((e) => ({
          eventId: e.id,
          error: "Supabase is not configured",
        })),
      };
    }

    const rows: EventInsert[] = events.map((event) => ({
      id: event.id,
      type: event.type,
      payload: event.payload as Record<string, unknown>,
      timestamp: event.timestamp,
      status: event.status,
      created_at: event.createdAt,
      synced_at: Date.now(),
      device_id: event.deviceId ?? null,
      error: null,
      retry_count: 0,
    }));

    log("Sending upsert request to Supabase...", { eventCount: rows.length });

    const { data, error } = await supabase
      .from("events")
      .upsert(rows, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      log("Supabase upsert error", { code: error.code, message: error.message, details: error.details, hint: error.hint });
      return {
        success: false,
        syncedIds: [],
        conflicts: [],
        errors: events.map((e) => ({
          eventId: e.id,
          error: error.message,
        })),
      };
    }

    const syncedData = (data ?? []) as EventRow[];
    log(`Successfully synced ${syncedData.length} events`);
    return {
      success: true,
      syncedIds: syncedData.map((row) => row.id),
      conflicts: [],
      errors: [],
    };
  }

  async pullEvents(since?: number): Promise<Event[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from("events")
      .select("*")
      .order("timestamp", { ascending: false });

    if (since !== undefined) {
      query = query.gt("timestamp", since);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[SupabaseEventAPI] pullEvents error:", error.message);
      return [];
    }

    const rows = (data ?? []) as EventRow[];
    return rows.map((row) => this.mapRowToEvent(row));
  }

  async healthCheck(): Promise<boolean> {
    log("Running health check...");

    if (!isSupabaseConfigured()) {
      log("Health check failed: Supabase not configured");
      return false;
    }

    try {
      const { data, error } = await supabase.from("events").select("id").limit(1);
      if (error) {
        log("Health check failed", { code: error.code, message: error.message, hint: error.hint });
        return false;
      }
      log("Health check passed", { rowCount: data?.length ?? 0 });
      return true;
    } catch (e) {
      log("Health check exception", e);
      return false;
    }
  }

  private mapRowToEvent(row: EventRow): Event {
    return {
      id: row.id,
      type: row.type as Event["type"],
      payload: row.payload as Event["payload"],
      timestamp: row.timestamp,
      status: row.status as Event["status"],
      createdAt: row.created_at,
      syncedAt: row.synced_at ?? undefined,
      deviceId: row.device_id ?? undefined,
      error: row.error ?? undefined,
      retryCount: row.retry_count,
    };
  }
}
