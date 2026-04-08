/* eslint-disable @typescript-eslint/no-explicit-any */
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../drizzle/schema";
import * as relations from "../drizzle/relations";

const fullSchema = { ...schema, ...relations };
type DbInstance = ReturnType<typeof drizzle<typeof fullSchema>>;

// Cache instances to avoid recreating them every time
const dbCache = new Map<string, DbInstance>();

function getConnectionString() {
  // In Cloudflare Workers (via vinext/vite-plugin-cloudflare shims),
  // bindings like HYPERDRIVE are typically available on process.env
  const hc = (process.env as { [key: string]: any }).HYPERDRIVE as
    | { connectionString?: string }
    | undefined;
  if (typeof hc === "object" && hc?.connectionString) {
    return hc.connectionString;
  }
  return process.env.DATABASE_URL!;
}

function getDbInstance(): DbInstance {
  const connectionString = getConnectionString();

  const cached = dbCache.get(connectionString);
  if (cached) return cached;

  const pool = new Pool({ connectionString });
  const instance = drizzle(pool, {
    schema: fullSchema,
  });

  dbCache.set(connectionString, instance);
  return instance;
}

// Export a Proxy as 'db' so we don't have to update imports in other files.
// This ensures that we always use the correct connection string (Hyperdrive or local).
export const db = new Proxy({} as DbInstance, {
  get(target, prop) {
    const activeDb = getDbInstance();
    const value = (activeDb as any)[prop];
    return typeof value === "function" ? value.bind(activeDb) : value;
  },
});
