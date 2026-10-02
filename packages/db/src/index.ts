import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export function createDatabase(url: string, options: { max?: number } = {}) {
  const client = postgres(url, { prepare: false, max: options.max ?? 10 });
  return drizzle(client, { schema, casing: "snake_case" });
}

export type Database = ReturnType<typeof createDatabase>;
export * from "./schema";
