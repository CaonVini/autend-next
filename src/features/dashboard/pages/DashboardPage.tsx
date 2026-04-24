"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentSession } from "@/src/features/auth/client/auth-api.client";
import styles from "./DashboardPage.module.css";

type AuthenticatedUser = {
  companyName?: string;
  email: string;
  id: string;
  name: string;
};

type NavItem = {
  active?: boolean;
  icon: ReactElement;
  label: string;
};

const navItems: NavItem[] = [
  { active: true, icon: <HomeIcon />, label: "Início" },
  { icon: <WidgetsIcon />, label: "Widgets" },
  { icon: <TicketIcon />, label: "Chamados" },
  { icon: <DocumentsIcon />, label: "Documentos" },
  { icon: <SettingsIcon />, label: "Configurações" },
];

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <main className={styles.loadingShell}>
        <div className={styles.loadingBadge}>
          Carregando painel...
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  const displayName = getDisplayName(currentUser);
  const firstName = getFirstName(displayName);
  const initials = getInitials(displayName);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <BoltIcon />
            </div>
            <span className={styles.logoText}>AjudaAI</span>
          </div>

          <nav className={styles.nav} aria-label="Principal">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-current={item.active ? "page" : undefined}
                className={joinClasses(
                  styles.navItem,
                  item.active && styles.navItemActive,
                )}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <button type="button" className={styles.userCard}>
            <span className={styles.avatar}>{initials}</span>
            <span className={styles.userCopy}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userEmail}>{currentUser.email}</span>
            </span>
            <ChevronDownIcon />
          </button>
        </aside>

        <section className={styles.mainContent}>
          <header className={styles.topBar}>
            <div className={styles.intro}>
              <h1 className={styles.greeting}>
                Olá, {firstName} <span aria-hidden="true">👋</span>
              </h1>
              <p className={styles.subtitle}>Como podemos te ajudar hoje?</p>
            </div>

            <div className={styles.actions}>
              <label className={styles.searchField}>
                <SearchIcon />
                <input
                  type="search"
                  aria-label="Buscar no sistema"
                  placeholder="Buscar no sistema..."
                />
              </label>

              <button
                type="button"
                className={styles.notificationsButton}
                aria-label="Notificações"
              >
                <BellIcon />
                <span className={styles.notificationDot} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <SparklesIcon />
            </div>
            <h2 className={styles.emptyStateTitle}>Bem-vindo ao AjudaAI</h2>
            <p className={styles.emptyStateSubtitle}>
              Seu assistente inteligente para suporte e gestão de conhecimento.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function getDisplayName(user: AuthenticatedUser) {
  const trimmedName = user.name.trim();

  if (trimmedName) {
    return trimmedName;
  }

  return user.email;
}

function getFirstName(name: string) {
  return name.split(/\s+/)[0] || name;
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AA";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.9 2.75 6.9 12.1h4.95L10.1 21.25l7-9.35h-4.95l1.75-9.15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.4 12 5l8 6.4v8.6a1 1 0 0 1-1 1h-5.1v-5.4H10.1V21H5a1 1 0 0 1-1-1v-8.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 5.75h12A1.75 1.75 0 0 1 19.75 7.5v7A1.75 1.75 0 0 1 18 16.25H9.3l-3.9 2.8.9-2.8H6A1.75 1.75 0 0 1 4.25 14.5v-7A1.75 1.75 0 0 1 6 5.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M8.5 11h.01M12 11h.01M15.5 11h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function WidgetsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="4.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="4.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4.5" y="13" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function DocumentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.75h6.8l4.2 4.2v9.55A1.75 1.75 0 0 1 16.25 20.25h-9.5A1.75 1.75 0 0 1 5 18.5v-12A1.75 1.75 0 0 1 6.75 4.75H7Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M13.5 4.75v4.5H18"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m10.52 4.87.35-1.37h2.26l.35 1.37a2 2 0 0 0 2.35 1.42l1.4-.34 1.13 1.96-.99 1.06a2 2 0 0 0 0 2.72l.99 1.06-1.13 1.96-1.4-.34a2 2 0 0 0-2.35 1.42l-.35 1.37h-2.26l-.35-1.37a2 2 0 0 0-2.35-1.42l-1.4.34-1.13-1.96.99-1.06a2 2 0 0 0 0-2.72l-.99-1.06 1.13-1.96 1.4.34a2 2 0 0 0 2.35-1.42Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5a4.25 4.25 0 0 0-4.25 4.25v2.06c0 .9-.3 1.77-.86 2.48L5.75 15.2v.8h12.5v-.8l-1.14-1.4a4 4 0 0 1-.86-2.48V9.25A4.25 4.25 0 0 0 12 5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M10 18a2.2 2.2 0 0 0 4 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <path
        d="M22.5 10.5c1.1 7.4 3.56 9.9 10.95 11-7.4 1.1-9.85 3.55-10.95 10.95-1.1-7.4-3.56-9.85-10.95-10.95 7.4-1.1 9.85-3.56 10.95-11Z"
        fill="currentColor"
      />
      <path
        d="M40.25 22.75c.66 4.39 2.11 5.84 6.5 6.5-4.39.66-5.84 2.11-6.5 6.5-.66-4.39-2.11-5.84-6.5-6.5 4.39-.66 5.84-2.11 6.5-6.5Z"
        fill="currentColor"
      />
      <path
        d="M35.25 6c.52 3.5 1.67 4.65 5.17 5.17-3.5.53-4.65 1.68-5.17 5.18-.53-3.5-1.68-4.65-5.18-5.18 3.5-.52 4.65-1.67 5.18-5.17Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}
