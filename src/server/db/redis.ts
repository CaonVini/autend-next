import Redis from "ioredis";
import { getEnv } from "@/src/server/config/env";

declare global {
  var __autendRedisClient__: Redis | undefined;
}

export function getRedisClient() {
  if (globalThis.__autendRedisClient__) {
    return globalThis.__autendRedisClient__;
  }

  const env = getEnv();

  const redis = new Redis(env.REDIS_URL, {
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  redis.on("error", (error) => {
    console.error("Redis connection error", error);
  });

  globalThis.__autendRedisClient__ = redis;
  return redis;
}
