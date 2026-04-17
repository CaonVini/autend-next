import { z } from "zod";

const booleanLikeSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return false;
}, z.boolean());

const envSchema = z.object({
  ACCESS_TOKEN_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  APP_URL: z.string().url(),
  AUTH_COOKIE_DOMAIN: z.string().trim().min(1).optional(),
  DATABASE_URL: z.string().url(),
  EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().positive().default(1440),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1),
  GOOGLE_OAUTH_REDIRECT_URL: z.string().url(),
  GOOGLE_OAUTH_STATE_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  REDIS_URL: z.string().url(),
  REFRESH_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(10),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(10),
  REGISTER_EMAIL_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(90),
  REGISTER_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  SMTP_FROM_EMAIL: z.string().email(),
  SMTP_FROM_NAME: z.string().trim().min(1),
  SMTP_HOST: z.string().trim().min(1),
  SMTP_PASSWORD: z.string().trim().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: booleanLikeSchema.default(false),
  SMTP_USER: z.string().trim().min(1),
  TOKEN_HASH_SECRET: z.string().min(32),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsedEnv = envSchema.safeParse(process.env);

  if (!parsedEnv.success) {
    const formattedIssues = parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid environment configuration.\n${formattedIssues}`);
  }

  cachedEnv = parsedEnv.data;
  return cachedEnv;
}
