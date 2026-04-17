import { Prisma } from "@prisma/client";
import { pendingRegistrationRepository } from "@/src/server/auth/repositories/pending-registration.repository";
import { userRepository } from "@/src/server/auth/repositories/user.repository";
import { recordAuthAuditEvent } from "@/src/server/auth/services/audit-log.service";
import { hashToken } from "@/src/server/core/security/crypto";
import { prisma } from "@/src/server/db/prisma";

export async function confirmPendingRegistration(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const pendingRegistration = await pendingRegistrationRepository.findByTokenHash(
    prisma,
    tokenHash,
  );

  if (
    !pendingRegistration ||
    pendingRegistration.consumedAt ||
    pendingRegistration.verificationTokenExpiresAt <= now
  ) {
    await recordAuthAuditEvent({
      email: pendingRegistration?.email,
      eventType: "REGISTER_CONFIRMATION_REJECTED",
      metadata: {
        reason: !pendingRegistration ? "NOT_FOUND" : "EXPIRED_OR_CONSUMED",
      },
    });

    return { success: false as const };
  }

  try {
    await prisma.$transaction(
      async (transactionClient) => {
        const freshPendingRegistration =
          await pendingRegistrationRepository.findByTokenHash(transactionClient, tokenHash);

        if (
          !freshPendingRegistration ||
          freshPendingRegistration.consumedAt ||
          freshPendingRegistration.verificationTokenExpiresAt <= now
        ) {
          throw new Error("PENDING_REGISTRATION_NOT_AVAILABLE");
        }

        const existingUser = await userRepository.findByEmail(
          transactionClient,
          freshPendingRegistration.email,
        );

        if (!existingUser) {
          await userRepository.createCredentialUser(transactionClient, {
            companyName: freshPendingRegistration.companyName ?? undefined,
            email: freshPendingRegistration.email,
            emailVerifiedAt: now,
            name: freshPendingRegistration.name,
            passwordHash: freshPendingRegistration.passwordHash,
          });
        }

        await pendingRegistrationRepository.markAsConsumed(
          transactionClient,
          freshPendingRegistration.id,
          now,
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: true as const };
    }

    const userCreatedDuringRace = await userRepository.findByEmail(prisma, pendingRegistration.email);

    if (!userCreatedDuringRace) {
      throw error;
    }
  }

  await recordAuthAuditEvent({
    email: pendingRegistration.email,
    eventType: "REGISTER_CONFIRMATION_ACCEPTED",
  });

  return { success: true as const };
}
