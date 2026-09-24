import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// één bron voor env-vars: dezelfde .env.local als de Next.js-app
config({ path: "../../apps/web/.env.local" });

export default defineConfig({
  schema: "./src/schema.ts",
  out: "../../supabase/migrations",
  dialect: "postgresql",
  casing: "snake_case", // camelCase in TS → snake_case in de DB
  dbCredentials: { url: process.env.DIRECT_URL! },
  schemaFilter: ["public"],
  migrations: { prefix: "supabase" }, // bestandsnamen die de Supabase CLI verwacht
});
