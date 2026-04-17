"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthSplitLayout } from "@/src/components/layout/AuthSplitLayout";
import { PageContainer } from "@/src/components/layout/PageContainer";
import { AuthTabs } from "@/src/components/ui/AuthTabs";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  AuthApiError,
  loginWithCredentials,
  registerWithCredentials,
} from "@/src/features/auth/client/auth-api.client";
import {
  credentialLoginSchema,
  registerRequestSchema,
} from "@/src/modules/auth/schemas/auth-request.schemas";

type AuthMode = "login" | "register";

type FormValues = {
  company: string;
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  company: "",
  confirmPassword: "",
  email: "",
  name: "",
  password: "",
};

const copy = {
  login: {
    description: "Acesse seu painel e gerencie seus widgets.",
    submitLabel: "Entrar no painel",
    title: "Bem-vindo de volta",
  },
  register: {
    description: "Crie sua conta e publique seu primeiro widget em minutos.",
    submitLabel: "Criar minha conta",
    title: "Crie sua conta",
  },
};

const verificationPendingCopy = {
  description: "Seu cadastro foi recebido. Agora falta confirmar o email para liberar o acesso.",
  title: "Cadastro quase pronto",
};

const authStatusMessages: Record<string, string> = {
  "email-verified": "Email confirmado com sucesso. Agora voce ja pode entrar.",
  "google-account-conflict":
    "Este email ja pertence a uma conta com senha. Entre com email e senha para continuar.",
  "oauth-cancelled": "A autenticacao com Google nao foi concluida.",
  "session-expired": "Sua sessao expirou. Entre novamente para continuar.",
  "verification-invalid": "O link de confirmacao e invalido ou expirou.",
};

type LoginPageProps = {
  authStatus?: string;
  pendingVerificationEmail?: string;
};

function resolveInitialMode(authStatus?: string): AuthMode {
  return authStatus === "verification-pending" ? "register" : "login";
}

function mapZodErrors(error: z.ZodError): FormErrors {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;

  return {
    company: fieldErrors.company?.[0],
    confirmPassword: fieldErrors.confirmPassword?.[0],
    email: fieldErrors.email?.[0],
    name: fieldErrors.name?.[0],
    password: fieldErrors.password?.[0],
  };
}

function mapApiFieldErrors(
  fieldErrors?: Record<string, string[] | undefined>,
): FormErrors {
  if (!fieldErrors) {
    return {};
  }

  return {
    company: fieldErrors.company?.[0],
    confirmPassword: fieldErrors.confirmPassword?.[0],
    email: fieldErrors.email?.[0],
    name: fieldErrors.name?.[0],
    password: fieldErrors.password?.[0],
  };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M21.8 12.23c0-.7-.06-1.38-.2-2.03H12v3.84h5.5a4.7 4.7 0 0 1-2.03 3.08v2.56h3.29c1.92-1.77 3.04-4.4 3.04-7.45Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.75 0 5.06-.91 6.75-2.47l-3.29-2.56c-.91.61-2.08.98-3.46.98-2.66 0-4.92-1.8-5.72-4.22H2.89v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.28 13.73A6 6 0 0 1 5.96 12c0-.6.11-1.17.32-1.73V7.63H2.89A10 10 0 0 0 2 12c0 1.6.39 3.11 1.08 4.37l3.2-2.64Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.04c1.5 0 2.85.52 3.9 1.54l2.92-2.92C17.05 2.98 14.74 2 12 2A10 10 0 0 0 3.08 7.63l3.2 2.64c.8-2.43 3.06-4.23 5.72-4.23Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7S3.73 16.06 2.46 12Z" />
      <circle cx="12" cy="12" r="3" />
      {open ? null : <path d="M4 4l16 16" />}
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 text-xs uppercase tracking-[0.28em] text-[#b0b7b1]">
      <div className="h-px flex-1 bg-[#e4e6e1]" />
      <span>Ou</span>
      <div className="h-px flex-1 bg-[#e4e6e1]" />
    </div>
  );
}

export function LoginPage({
  authStatus,
  pendingVerificationEmail: initialPendingVerificationEmail,
}: LoginPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(resolveInitialMode(authStatus));
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(
    initialPendingVerificationEmail ?? "",
  );

  const isVerificationPending = mode === "register" && Boolean(pendingVerificationEmail);
  const activeCopy = isVerificationPending ? verificationPendingCopy : copy[mode];
  const submitLabel = copy[mode].submitLabel;
  const statusMessage = useMemo(() => {
    return authStatus ? authStatusMessages[authStatus] : "";
  }, [authStatus]);

  useEffect(() => {
    setMode(resolveInitialMode(authStatus));
    setPendingVerificationEmail(initialPendingVerificationEmail ?? "");
  }, [authStatus, initialPendingVerificationEmail]);

  function updateField(field: keyof FormValues, nextValue: string) {
    setValues((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function clearVerificationPendingState() {
    setPendingVerificationEmail("");
    setFeedbackMessage("");

    if (authStatus === "verification-pending") {
      router.replace("/");
    }
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    setValues(initialValues);
    setErrors({});
    setFeedbackMessage("");
    setPendingVerificationEmail("");
    setShowPassword(false);
    setShowConfirmPassword(false);

    if (authStatus) {
      router.replace("/");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setErrors({});
    setFeedbackMessage("");

    try {
      if (mode === "login") {
        const parsedPayload = credentialLoginSchema.parse({
          email: values.email,
          password: values.password,
        });

        const loginResult = await loginWithCredentials(parsedPayload);
        router.push(loginResult.redirectPath);
        return;
      }

      const parsedPayload = registerRequestSchema.parse({
        company: values.company,
        confirmPassword: values.confirmPassword,
        email: values.email,
        name: values.name,
        password: values.password,
      });

      const registerResult = await registerWithCredentials(parsedPayload);
      setFeedbackMessage("");
      setErrors({});
      setValues(initialValues);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setPendingVerificationEmail(parsedPayload.email);
      router.replace(
        `/?auth=verification-pending&email=${encodeURIComponent(parsedPayload.email)}`,
      );

      if (!registerResult.message) {
        return;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(mapZodErrors(error));
      } else if (error instanceof AuthApiError) {
        setErrors(mapApiFieldErrors(error.fieldErrors));
        setFeedbackMessage(error.message);
      } else {
        setFeedbackMessage("Nao foi possivel concluir a operacao.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleSignIn() {
    setIsGoogleRedirecting(true);
    window.location.href = "/api/auth/google/authorize?redirectTo=/dashboard";
  }

  const passwordToggle = (
    <button
      type="button"
      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
      className="cursor-pointer rounded-md text-[#96a198] hover:text-[#546257] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f3a]/20"
      onClick={() => setShowPassword((current) => !current)}
    >
      <EyeIcon open={showPassword} />
    </button>
  );

  const confirmPasswordToggle = (
    <button
      type="button"
      aria-label={showConfirmPassword ? "Ocultar confirmacao de senha" : "Mostrar confirmacao de senha"}
      className="cursor-pointer rounded-md text-[#96a198] hover:text-[#546257] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6f3a]/20"
      onClick={() => setShowConfirmPassword((current) => !current)}
    >
      <EyeIcon open={showConfirmPassword} />
    </button>
  );

  return (
    <PageContainer>
      <AuthSplitLayout
        eyebrow="AjudaAI"
        title={
          <>
            Suporte automatico
            <br />
            sem abrir mao
            <br />
            <span className="text-[#38e27a]">da qualidade.</span>
          </>
        }
        description="Treine a IA com seus dados e documentos e seus visitantes serao respondidos 24 horas por dia."
        stats={[
          { label: "chamados resolvidos", value: "70%" },
          { label: "para instalar", value: "2min" },
          { label: "times em piloto", value: "12+" },
        ]}
      >
        <div className="rounded-[1.75rem] bg-[#f5f1ec] px-1 py-1 sm:px-0">
          <div className="max-w-[430px] space-y-6 lg:space-y-5">
            <AuthTabs activeTab={mode} onChange={handleModeChange} />

            <div>
              <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#07140a]">
                {activeCopy.title}
              </h2>
              <p className="mt-2 text-base leading-7 text-[#8b938d]">
                {activeCopy.description}
              </p>
            </div>

            {(statusMessage || feedbackMessage) && (
              <p className="rounded-xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5c39]">
                {feedbackMessage || statusMessage}
              </p>
            )}

            {isVerificationPending ? null : (
              <>
                <Button
                  variant="secondary"
                  fullWidth
                  className="font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleRedirecting}
                >
                  <GoogleIcon />
                  {isGoogleRedirecting ? "Redirecionando..." : "Continuar com Google"}
                </Button>

                <Divider />
              </>
            )}

            {isVerificationPending ? (
              <div className="relative overflow-hidden rounded-[1.7rem] border border-[#e7ddd0] bg-[linear-gradient(145deg,#fffefd_0%,#fbf5eb_52%,#f3faf4_100%)] px-5 py-5 shadow-[0_26px_70px_rgba(33,25,13,0.08)]">
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
                <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(56,226,122,0.14),transparent_70%)]" />

                <div className="relative">
                  <h3 className="text-[1.38rem] font-semibold tracking-[-0.045em] text-[#07140a]">
                    Verifique seu email
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#676d67]">
                    Enviamos a confirmacao para o endereco abaixo. Seu acesso sera liberado
                    assim que o link for validado.
                  </p>
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-[#eadfcf] bg-[linear-gradient(180deg,#fffdfa_0%,#faf4eb_100%)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a7559]">
                    Email de confirmacao
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-[#102f1b]">
                    {pendingVerificationEmail}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-6 text-[#555d57]">
                  Verifique sua caixa de entrada, spam e promocoes. Se voce acabou de
                  solicitar o cadastro, um link recente ainda pode estar valido.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button
                    fullWidth
                    onClick={clearVerificationPendingState}
                    variant="secondary"
                    className="border-[#dfd4c5] bg-white/85 text-[#3f3422] hover:bg-[#fff8ee]"
                  >
                    Usar outro email
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => handleModeChange("login")}
                    variant="ghost"
                    className="bg-[#eef7f0] text-[#1e6f3a] hover:bg-[#e5f2e8]"
                  >
                    Voltar para entrar
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                {mode === "register" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="name"
                      label="Nome completo"
                      type="text"
                      placeholder="Joao Silva"
                      autoComplete="name"
                      value={values.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      error={errors.name}
                    />
                    <Input
                      id="company"
                      label="Empresa"
                      type="text"
                      placeholder="Sua empresa"
                      autoComplete="organization"
                      value={values.company}
                      onChange={(event) => updateField("company", event.target.value)}
                      error={errors.company}
                    />
                  </div>
                ) : null}

                <Input
                  id="email"
                  label="E-mail"
                  type="email"
                  placeholder="joao@empresa.com.br"
                  autoComplete="email"
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  error={errors.email}
                />

                <Input
                  id="password"
                  label="Senha"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "login" ? "********" : "Crie uma senha forte"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  hint={
                    mode === "login" ? (
                      <button
                        type="button"
                        className="text-sm font-medium text-[#1e6f3a] hover:text-[#17572d]"
                      >
                        Esqueci a senha
                      </button>
                    ) : (
                      <span className="text-xs text-[#8b938d]">Minimo de 8 caracteres</span>
                    )
                  }
                  endAdornment={passwordToggle}
                  endAdornmentInteractive
                  value={values.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  error={errors.password}
                />

                {mode === "register" ? (
                  <Input
                    id="confirmPassword"
                    label="Confirmar senha"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita sua senha"
                    autoComplete="new-password"
                    endAdornment={confirmPasswordToggle}
                    endAdornmentInteractive
                    value={values.confirmPassword}
                    onChange={(event) => updateField("confirmPassword", event.target.value)}
                    error={errors.confirmPassword}
                  />
                ) : null}

                <Button type="submit" fullWidth className="mt-1" disabled={isSubmitting}>
                  {isSubmitting ? "Processando..." : submitLabel}
                  <ArrowRightIcon />
                </Button>
              </form>
            )}
          </div>
        </div>
      </AuthSplitLayout>
    </PageContainer>
  );
}
