import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// één bron voor env-vars: dezelfde .env.local als de Next.js-app
config({ path: "../../apps/web/.env.local" });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL! },
  schemaFilter: ["public"],
});
