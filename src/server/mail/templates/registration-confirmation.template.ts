import { escapeHtml } from "@/src/server/core/security/crypto";

type RegistrationConfirmationTemplateInput = {
  confirmationUrl: string;
  recipientName: string;
};

export function buildRegistrationConfirmationTemplate(
  input: RegistrationConfirmationTemplateInput,
) {
  const safeName = escapeHtml(input.recipientName);
  const safeUrl = escapeHtml(input.confirmationUrl);

  return {
    html: `
      <div style="font-family: Arial, sans-serif; color: #07140a; background: #f7f4ef; padding: 24px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px;">
          <h1 style="margin: 0 0 16px; font-size: 24px;">Confirme seu email</h1>
          <p style="margin: 0 0 16px; line-height: 1.6;">
            Ola, ${safeName}. Confirme seu email para ativar a conta e concluir o cadastro com seguranca.
          </p>
          <p style="margin: 0 0 24px; line-height: 1.6;">
            Este link expira em breve e pode ser usado apenas uma vez.
          </p>
          <a
            href="${safeUrl}"
            style="display: inline-block; padding: 14px 20px; background: #1e6f3a; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;"
          >
            Confirmar email
          </a>
          <p style="margin: 24px 0 0; line-height: 1.6; color: #546257;">
            Se voce nao solicitou este cadastro, ignore esta mensagem.
          </p>
        </div>
      </div>
    `,
    subject: "Confirme seu cadastro no AjudaAI",
    text: [
      `Ola, ${input.recipientName}.`,
      "",
      "Confirme seu email para ativar a conta e concluir o cadastro com seguranca.",
      "Use o link abaixo:",
      input.confirmationUrl,
      "",
      "Se voce nao solicitou este cadastro, ignore esta mensagem.",
    ].join("\n"),
  };
}
