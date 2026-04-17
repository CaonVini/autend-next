import type { Prisma } from "@prisma/client";
import type { DatabaseClient } from "@/src/server/db/prisma";

type CreateAuditEventInput = {
  email?: string;
  eventType: string;
  ipAddress?: string;
  metadata?: Prisma.InputJsonValue;
  userAgent?: string;
  userId?: string;
};

export const authAuditRepository = {
  create(client: DatabaseClient, input: CreateAuditEventInput) {
    return client.authAuditEvent.create({
      data: {
        email: input.email,
        eventType: input.eventType,
        ipAddress: input.ipAddress,
        metadata: input.metadata,
        userAgent: input.userAgent,
        userId: input.userId,
      },
    });
  },
};
