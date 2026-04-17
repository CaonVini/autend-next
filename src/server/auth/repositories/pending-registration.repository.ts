import type { DatabaseClient } from "@/src/server/db/prisma";

type UpsertPendingRegistrationInput = {
  companyName?: string;
  email: string;
  name: string;
  passwordHash: string;
  requestedFromIp?: string;
  requestedUserAgent?: string;
  verificationTokenExpiresAt: Date;
  verificationTokenHash: string;
};

export const pendingRegistrationRepository = {
  findByEmail(client: DatabaseClient, email: string) {
    return client.pendingRegistration.findUnique({
      where: { email },
    });
  },

  findByTokenHash(client: DatabaseClient, verificationTokenHash: string) {
    return client.pendingRegistration.findUnique({
      where: { verificationTokenHash },
    });
  },

  markAsConsumed(client: DatabaseClient, pendingRegistrationId: string, consumedAt: Date) {
    return client.pendingRegistration.update({
      data: {
        consumedAt,
      },
      where: { id: pendingRegistrationId },
    });
  },

  updateDispatchCooldown(
    client: DatabaseClient,
    pendingRegistrationId: string,
    resendAvailableAt: Date,
  ) {
    return client.pendingRegistration.update({
      data: {
        resendAvailableAt,
      },
      where: { id: pendingRegistrationId },
    });
  },

  upsert(client: DatabaseClient, input: UpsertPendingRegistrationInput) {
    return client.pendingRegistration.upsert({
      create: {
        attemptCount: 1,
        companyName: input.companyName,
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        requestedFromIp: input.requestedFromIp,
        requestedUserAgent: input.requestedUserAgent,
        verificationTokenExpiresAt: input.verificationTokenExpiresAt,
        verificationTokenHash: input.verificationTokenHash,
      },
      update: {
        attemptCount: {
          increment: 1,
        },
        companyName: input.companyName,
        consumedAt: null,
        name: input.name,
        passwordHash: input.passwordHash,
        requestedFromIp: input.requestedFromIp,
        requestedUserAgent: input.requestedUserAgent,
        verificationTokenExpiresAt: input.verificationTokenExpiresAt,
        verificationTokenHash: input.verificationTokenHash,
      },
      where: { email: input.email },
    });
  },
};
