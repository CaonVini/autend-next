import { z } from "zod";

const normalizedEmailSchema = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(320, "E-mail muito longo.")
  .email("Digite um e-mail valido.")
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no minimo 8 caracteres.")
  .max(72, "A senha excede o limite permitido.");

const optionalCompanySchema = z
  .string()
  .trim()
  .max(120, "O nome da empresa deve ter no maximo 120 caracteres.")
  .optional()
  .transform((value) => (value ? value : undefined));

export const credentialLoginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1, "Informe sua senha.").max(72),
});

export const registerRequestSchema = z
  .object({
    company: optionalCompanySchema,
    confirmPassword: z.string().max(72),
    email: normalizedEmailSchema,
    name: z
      .string()
      .trim()
      .min(3, "Informe seu nome completo.")
      .max(120, "O nome deve ter no maximo 120 caracteres."),
    password: passwordSchema,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export const emailVerificationTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(32, "Token de verificacao invalido.")
    .max(512, "Token de verificacao invalido."),
});

export const googleAuthorizationQuerySchema = z.object({
  redirectTo: z
    .string()
    .trim()
    .max(2048)
    .optional(),
});

export const googleCallbackQuerySchema = z.object({
  code: z.string().trim().min(1, "Codigo OAuth ausente."),
  error: z.string().trim().optional(),
  state: z.string().trim().min(1, "State OAuth ausente.").max(512),
});

export type CredentialLoginInput = z.infer<typeof credentialLoginSchema>;
export type RegisterRequestInput = z.infer<typeof registerRequestSchema>;
