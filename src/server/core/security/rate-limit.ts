import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "@/src/server/db/redis";
import { ApplicationError } from "@/src/server/core/errors/application-error";

type RateLimitConfig = {
  blockDurationSeconds?: number;
  durationSeconds: number;
  key: string;
  keyPrefix: string;
  maxAttempts: number;
};

const limiterRegistry = new Map<string, RateLimiterRedis>();

function limiterSignature(config: Omit<RateLimitConfig, "key">) {
  return [
    config.keyPrefix,
    config.maxAttempts,
    config.durationSeconds,
    config.blockDurationSeconds ?? config.durationSeconds,
  ].join(":");
}

async function getLimiter(config: Omit<RateLimitConfig, "key">) {
  const signature = limiterSignature(config);

  if (limiterRegistry.has(signature)) {
    return limiterRegistry.get(signature)!;
  }

  const redis = getRedisClient();

  if (redis.status === "wait") {
    await redis.connect();
  }

  const limiter = new RateLimiterRedis({
    blockDuration: config.blockDurationSeconds ?? config.durationSeconds,
    duration: config.durationSeconds,
    keyPrefix: config.keyPrefix,
    points: config.maxAttempts,
    storeClient: redis,
  });

  limiterRegistry.set(signature, limiter);
  return limiter;
}

function isRateLimiterResult(value: unknown): value is { msBeforeNext: number } {
  return typeof value === "object" && value !== null && "msBeforeNext" in value;
}

export async function enforceRateLimit(config: RateLimitConfig) {
  try {
    const limiter = await getLimiter(config);
    await limiter.consume(config.key);
  } catch (error) {
    if (isRateLimiterResult(error)) {
      const retryAfterSeconds = Math.max(1, Math.ceil(error.msBeforeNext / 1000));

      throw new ApplicationError({
        code: "RATE_LIMIT_EXCEEDED",
        details: { retryAfterSeconds },
        publicMessage: "Muitas tentativas. Aguarde um momento antes de tentar novamente.",
        statusCode: 429,
      });
    }

    throw new ApplicationError({
      cause: error,
      code: "RATE_LIMIT_UNAVAILABLE",
      publicMessage: "Nao foi possivel validar a requisicao neste momento.",
      statusCode: 503,
    });
  }
}

export async function resetRateLimit(config: RateLimitConfig) {
  const limiter = await getLimiter(config);
  await limiter.delete(config.key);
}
