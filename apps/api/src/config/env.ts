import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().default(9000),
  LOG_DISABLED: z.stringbool().default(false),

  DATABASE_URL: z.url(),

  AUTH_JWT_SECRET: z
    .string()
    .min(32, "AUTH_JWT_SECRET moet minstens 32 tekens lang zijn"),
  AUTH_JWT_EXPIRATION_INTERVAL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 7), // seconden
  AUTH_JWT_AUDIENCE: z.string().default("kotzoeker"),
  AUTH_JWT_ISSUER: z.string().default("kotzoeker"),
  AUTH_MAX_DELAY: z.coerce.number().int().min(0).default(1000), // ms, tegen timing-aanvallen op login
  AUTH_HASH_TIME_COST: z.coerce.number().int().min(2).default(3),
  AUTH_HASH_MEMORY_COST: z.coerce.number().int().min(1024).default(65536), // KiB

  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_FORCE_PATH_STYLE: z.stringbool().default(true),
  PHOTOS_PUBLIC_URL: z.url(),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Ongeldige configuratie:\n${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}
