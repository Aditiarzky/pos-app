/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import * as schema from "../drizzle/schema";
import * as relations from "../drizzle/relations";

const fullSchema = { ...schema, ...relations };

type DbInstance = ReturnType<typeof drizzleNeon<typeof fullSchema>>;

const isProduction = process.env.NODE_ENV === "production";

function getConnectionString() {
  const hc = (process.env as { [key: string]: any }).HYPERDRIVE as
    | { connectionString?: string }
    | undefined;
  if (typeof hc === "object" && hc?.connectionString) {
    return hc.connectionString;
  }
  return process.env.DATABASE_URL!;
}

let dbInstance: DbInstance;

if (isProduction) {
  // Production: Cloudflare Workers / Hyperdrive / Neon cloud
  const { drizzle } = require("drizzle-orm/neon-serverless");
  const { Pool } = require("@neondatabase/serverless");

  const pool = new Pool({ connectionString: getConnectionString() });
  dbInstance = drizzle(pool, { schema: fullSchema });
} else {
  // Local development: PostgreSQL biasa via node-postgres
  const { drizzle } = require("drizzle-orm/node-postgres");
  const { Pool } = require("pg");

  const pool = new Pool({ connectionString: getConnectionString() });
  dbInstance = drizzle(pool, { schema: fullSchema });
}

export const db = dbInstance;
