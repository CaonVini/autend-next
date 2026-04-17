"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutCurrentSession, fetchCurrentSession } from "@/src/features/auth/client/auth-api.client";
import { Button } from "@/src/components/ui/Button";

type AuthenticatedUser = {
  companyName?: string;
  email: string;
  id: string;
  name: string;
};

export function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetchCurrentSession()
      .then((session) => {
        if (!mounted) {
          return;
        }

        setCurrentUser(session.user);
      })
      .catch(() => {
        router.replace("/?auth=session-expired");
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logoutCurrentSession();
    } finally {
      router.replace("/");
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f1ec] px-6 py-12">
        <div className="rounded-2xl border border-[#d9ddd7] bg-white px-6 py-5 text-sm text-[#546257] shadow-sm">
          Validando sua sessao...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f5f1ec] px-6 py-8">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-[#d9ddd7] bg-white p-8 shadow-[0_20px_60px_rgba(7,20,10,0.08)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#7a867d]">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#07140a]">
              Sessao autenticada com sucesso
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f7d73]">
              Este e um painel minimo para validar o backend de autenticacao,
              cookies seguros, refresh token e leitura da sessao no proprio app.
            </p>
          </div>

          <Button onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? "Encerrando..." : "Sair"}
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[#f6f7f4] p-5">
            <p className="text-sm text-[#7a867d]">Nome</p>
            <p className="mt-2 text-lg font-medium text-[#07140a]">{currentUser.name}</p>
          </div>
          <div className="rounded-2xl bg-[#f6f7f4] p-5">
            <p className="text-sm text-[#7a867d]">E-mail</p>
            <p className="mt-2 text-lg font-medium text-[#07140a]">{currentUser.email}</p>
          </div>
          <div className="rounded-2xl bg-[#f6f7f4] p-5">
            <p className="text-sm text-[#7a867d]">Empresa</p>
            <p className="mt-2 text-lg font-medium text-[#07140a]">
              {currentUser.companyName || "Nao informado"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#f6f7f4] p-5">
            <p className="text-sm text-[#7a867d]">User ID</p>
            <p className="mt-2 break-all text-lg font-medium text-[#07140a]">
              {currentUser.id}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
