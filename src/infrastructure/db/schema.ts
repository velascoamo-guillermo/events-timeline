import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "events",
      columns: [
        { name: "type", type: "string" },
        { name: "payload", type: "string" },
        { name: "timestamp", type: "number" },
        { name: "status", type: "string" },
        { name: "created_at", type: "number" },
        { name: "synced_at", type: "number", isOptional: true },
        { name: "error", type: "string", isOptional: true },
        { name: "retry_count", type: "number", isOptional: true },
        { name: "device_id", type: "string", isOptional: true },
      ],
    }),
  ],
});
