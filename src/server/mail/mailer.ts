import nodemailer from "nodemailer";
import { getEnv } from "@/src/server/config/env";
import { ApplicationError } from "@/src/server/core/errors/application-error";

type MailMessage = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getSafeMailErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: "unknown mail transport error" };
  }

  const transportError = error as Error & {
    code?: string;
    response?: string;
    responseCode?: number;
  };

  return {
    code: transportError.code,
    message: transportError.message,
    response: transportError.response,
    responseCode: transportError.responseCode,
  };
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const env = getEnv();

  cachedTransporter = nodemailer.createTransport({
    auth: {
      pass: env.SMTP_PASSWORD,
      user: env.SMTP_USER,
    },
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
  });

  return cachedTransporter;
}

export async function sendEmail(message: MailMessage) {
  try {
    const env = getEnv();

    await getTransporter().sendMail({
      from: {
        address: env.SMTP_FROM_EMAIL,
        name: env.SMTP_FROM_NAME,
      },
      html: message.html,
      subject: message.subject,
      text: message.text,
      to: message.to,
    });
  } catch (error) {
    console.error("Email delivery failed", {
      details: getSafeMailErrorDetails(error),
      to: message.to,
    });

    throw new ApplicationError({
      cause: error,
      code: "EMAIL_DELIVERY_FAILED",
      publicMessage: "Nao foi possivel enviar o email de confirmacao neste momento.",
      statusCode: 503,
    });
  }
}
