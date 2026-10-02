import { Inject, Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDatabase, type Database } from "@kotzoeker/db";
import type { Env } from "../config/env";

export const DRIZZLE = Symbol("DRIZZLE");
export const InjectDrizzle = () => Inject(DRIZZLE);
export type DatabaseProvider = Database;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>) =>
    createDatabase(config.get("DATABASE_URL", { infer: true })),
};
