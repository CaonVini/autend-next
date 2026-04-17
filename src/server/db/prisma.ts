import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { getEnv } from "@/src/server/config/env";

declare global {
  var __autendPrismaClient__: PrismaClient | undefined;
  var __autendPgPool__: Pool | undefined;
}

const pgPool =
  globalThis.__autendPgPool__ ??
  new Pool({
    connectionString: getEnv().DATABASE_URL,
    max: process.env.NODE_ENV === "development" ? 10 : 20,
  });

const prismaAdapter = new PrismaPg(pgPool);

export const prisma =
  globalThis.__autendPrismaClient__ ??
  new PrismaClient({
    adapter: prismaAdapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__autendPgPool__ = pgPool;
  globalThis.__autendPrismaClient__ = prisma;
}

export type DatabaseClient = PrismaClient | Prisma.TransactionClient;
