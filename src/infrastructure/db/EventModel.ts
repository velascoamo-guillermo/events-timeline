import { Model } from "@nozbe/watermelondb";
import { date, field, readonly } from "@nozbe/watermelondb/decorators";
import type {
  EventPayload,
  EventType,
  SyncStatus,
} from "../../domain/models/Event";

export class EventModel extends Model {
  static table = "events";

  @field("type") type!: EventType;
  @field("payload") payloadRaw!: string; // JSON string
  @field("timestamp") timestamp!: number;
  @field("status") status!: SyncStatus;
  @readonly @date("created_at") createdAt!: Date;
  @date("synced_at") syncedAt?: Date;
  @field("error") error?: string;
  @field("retry_count") retryCount?: number;
  @field("device_id") deviceId?: string;

  // Helper para parsear el payload
  get payload(): EventPayload {
    return JSON.parse(this.payloadRaw);
  }
}
