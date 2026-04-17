import { getEnv } from "@/src/server/config/env";
import { AUTH_RATE_LIMIT_PREFIXES } from "@/src/server/auth/constants/auth.constants";
import { pendingRegistrationRepository } from "@/src/server/auth/repositories/pending-registration.repository";
import { userRepository } from "@/src/server/auth/repositories/user.repository";
import { recordAuthAuditEvent } from "@/src/server/auth/services/audit-log.service";
import { hashPassword } from "@/src/server/auth/utils/password";
import { buildRegistrationConfirmationTemplate } from "@/src/server/mail/templates/registration-confirmation.template";
import { sendEmail } from "@/src/server/mail/mailer";
import { enforceRateLimit } from "@/src/server/core/security/rate-limit";
import { generateSecureToken, hashToken } from "@/src/server/core/security/crypto";
import { prisma } from "@/src/server/db/prisma";
import type { RegisterRequestInput } from "@/src/modules/auth/schemas/auth-request.schemas";
import type { RequestMetadata } from "@/src/server/core/security/request-metadata";

export const REGISTRATION_ACCEPTED_MESSAGE =
  "Se o email informado estiver elegivel para cadastro, enviaremos um link de confirmacao em instantes.";

export async function registerPendingUser(
  input: RegisterRequestInput,
  requestMetadata: RequestMetadata,
) {
  const env = getEnv();
  const now = new Date();
  const ipAddress = requestMetadata.ipAddress ?? "unknown";

  await enforceRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: input.email,
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.registerByEmail,
    maxAttempts: env.REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
  });

  await enforceRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: ipAddress,
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.registerByIp,
    maxAttempts: env.REGISTER_RATE_LIMIT_MAX_ATTEMPTS,
  });

  const existingUser = await userRepository.findByEmail(prisma, input.email);

  if (existingUser) {
    await recordAuthAuditEvent({
      email: input.email,
      eventType: "REGISTER_REQUEST_SKIPPED_EXISTING_USER",
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
    });

    return { message: REGISTRATION_ACCEPTED_MESSAGE };
  }

  const existingPendingRegistration = await pendingRegistrationRepository.findByEmail(
    prisma,
    input.email,
  );

  if (
    existingPendingRegistration &&
    !existingPendingRegistration.consumedAt &&
    existingPendingRegistration.verificationTokenExpiresAt > now &&
    existingPendingRegistration.resendAvailableAt > now
  ) {
    await recordAuthAuditEvent({
      email: input.email,
      eventType: "REGISTER_REQUEST_SKIPPED_RESEND_COOLDOWN",
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
    });

    return { message: REGISTRATION_ACCEPTED_MESSAGE };
  }

  const verificationToken = generateSecureToken(48);
  const passwordHash = await hashPassword(input.password);
  const pendingRegistration = await pendingRegistrationRepository.upsert(prisma, {
    companyName: input.company,
    email: input.email,
    name: input.name,
    passwordHash,
    requestedFromIp: requestMetadata.ipAddress,
    requestedUserAgent: requestMetadata.userAgent,
    verificationTokenExpiresAt: new Date(
      now.getTime() + env.EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000,
    ),
    verificationTokenHash: hashToken(verificationToken),
  });

  const confirmationUrl = `${env.APP_URL}/api/auth/register/confirm?token=${encodeURIComponent(
    verificationToken,
  )}`;

  const emailTemplate = buildRegistrationConfirmationTemplate({
    confirmationUrl,
    recipientName: input.name,
  });

  try {
    await sendEmail({
      html: emailTemplate.html,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      to: input.email,
    });
  } catch (error) {
    await recordAuthAuditEvent({
      email: input.email,
      eventType: "REGISTER_REQUEST_EMAIL_DELIVERY_FAILED",
      ipAddress: requestMetadata.ipAddress,
      metadata: {
        pendingRegistrationId: pendingRegistration.id,
      },
      userAgent: requestMetadata.userAgent,
    });

    throw error;
  }

  await pendingRegistrationRepository.updateDispatchCooldown(
    prisma,
    pendingRegistration.id,
    new Date(now.getTime() + env.REGISTER_EMAIL_RESEND_COOLDOWN_SECONDS * 1000),
  );

  await recordAuthAuditEvent({
    email: input.email,
    eventType: "REGISTER_REQUEST_ACCEPTED",
    ipAddress: requestMetadata.ipAddress,
    metadata: {
      pendingRegistrationId: pendingRegistration.id,
    },
    userAgent: requestMetadata.userAgent,
  });

  return { message: REGISTRATION_ACCEPTED_MESSAGE };
}
