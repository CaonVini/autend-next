"use client";

import { type FormEvent, useMemo, useState } from "react";
import { AuthSplitLayout } from "@/src/components/layout/AuthSplitLayout";
import { PageContainer } from "@/src/components/layout/PageContainer";
import { AuthTabs } from "@/src/components/ui/AuthTabs";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";

type AuthMode = "login" | "register";

type FormValues = {
  name: string;
  company: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  company: "",
  email: "",
  password: "",
  confirmPassword: "",
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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateField(
  mode: AuthMode,
  field: keyof FormValues,
  values: FormValues,
): string {
  const value = values[field].trim();

  if (field === "name" && mode === "register" && value.length < 3) {
    return "Informe seu nome completo.";
  }

  if (field === "company" && mode === "register" && value.length < 2) {
    return "Informe o nome da empresa.";
  }

  if (field === "email") {
    if (!value) {
      return "Informe seu e-mail.";
    }

    if (!isValidEmail(value)) {
      return "Digite um e-mail valido.";
    }
  }

  if (field === "password") {
    if (!values.password) {
      return "Informe sua senha.";
    }

    if (mode === "register" && values.password.length < 8) {
      return "A senha deve ter no minimo 8 caracteres.";
    }
  }

  if (
    field === "confirmPassword" &&
    mode === "register" &&
    values.confirmPassword !== values.password
  ) {
    return "As senhas precisam ser iguais.";
  }

  return "";
}

function validateForm(mode: AuthMode, values: FormValues): FormErrors {
  const fields: Array<keyof FormValues> =
    mode === "register"
      ? ["name", "company", "email", "password", "confirmPassword"]
      : ["email", "password"];

  return fields.reduce<FormErrors>((errors, field) => {
    const message = validateField(mode, field, values);

    if (message) {
      errors[field] = message;
    }

    return errors;
  }, {});
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

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const activeCopy = copy[mode];

  const visibleErrors = useMemo(() => {
    return Object.entries(errors).reduce<FormErrors>((acc, [field, message]) => {
      if (touched[field as keyof FormValues] && message) {
        acc[field as keyof FormValues] = message;
      }

      return acc;
    }, {});
  }, [errors, touched]);

  function updateField(field: keyof FormValues, nextValue: string) {
    const nextValues = { ...values, [field]: nextValue };
    setValues(nextValues);

    if (touched[field]) {
      setErrors((current) => ({
        ...current,
        [field]: validateField(mode, field, nextValues),
      }));
    }

    if (mode === "register" && (field === "password" || field === "confirmPassword")) {
      setErrors((current) => ({
        ...current,
        password: touched.password ? validateField(mode, "password", nextValues) : current.password,
        confirmPassword: touched.confirmPassword
          ? validateField(mode, "confirmPassword", nextValues)
          : current.confirmPassword,
      }));
    }
  }

  function touchField(field: keyof FormValues) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({
      ...current,
      [field]: validateField(mode, field, values),
    }));
  }

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(mode, values);
    setErrors(nextErrors);
    setTouched({
      name: true,
      company: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setSubmitMessage("Revise os campos destacados antes de continuar.");
      return;
    }

    setSubmitMessage(
      mode === "login"
        ? "Validacao frontend concluida. Pronto para conectar ao backend."
        : "Conta pronta para envio. O backend pode reutilizar as mesmas regras.",
    );
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

            <Button variant="secondary" fullWidth className="font-medium">
              <GoogleIcon />
              Continuar com Google
            </Button>

            <Divider />

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
                    onBlur={() => touchField("name")}
                    onChange={(event) => updateField("name", event.target.value)}
                    error={visibleErrors.name}
                  />
                  <Input
                    id="company"
                    label="Empresa"
                    type="text"
                    placeholder="Sua empresa"
                    autoComplete="organization"
                    value={values.company}
                    onBlur={() => touchField("company")}
                    onChange={(event) => updateField("company", event.target.value)}
                    error={visibleErrors.company}
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
                onBlur={() => touchField("email")}
                onChange={(event) => updateField("email", event.target.value)}
                error={visibleErrors.email}
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
                onBlur={() => touchField("password")}
                onChange={(event) => updateField("password", event.target.value)}
                error={visibleErrors.password}
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
                  onBlur={() => touchField("confirmPassword")}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  error={visibleErrors.confirmPassword}
                />
              ) : null}

              {submitMessage ? (
                <p className="rounded-xl bg-[#eef5ef] px-4 py-3 text-sm text-[#2f5c39]">
                  {submitMessage}
                </p>
              ) : null}

              <Button type="submit" fullWidth className="mt-1">
                {activeCopy.submitLabel}
                <ArrowRightIcon />
              </Button>
            </form>
          </div>
        </div>
      </AuthSplitLayout>
    </PageContainer>
  );
}
