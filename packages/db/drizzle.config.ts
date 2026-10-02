import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: "../../apps/api/.env", quiet: true });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  casing: "snake_case", // camelCase in TS → snake_case in de DB
  dbCredentials: { url: process.env.DATABASE_URL! },
  schemaFilter: ["public"],
});
