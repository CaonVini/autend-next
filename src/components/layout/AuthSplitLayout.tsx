import type { ReactNode } from "react";

type Stat = {
  label: string;
  value: string;
};

type AuthSplitLayoutProps = {
  children: ReactNode;
  eyebrow: string;
  title: ReactNode;
  description: string;
  stats: Stat[];
};

function BoltIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.6 2.5 5.9 10h3l-1 7.5 5.8-7.5h-3.1l1-7.5Z" />
    </svg>
  );
}

export function AuthSplitLayout({
  children,
  description,
  eyebrow,
  stats,
  title,
}: AuthSplitLayoutProps) {
  return (
    <section className="grid min-h-[calc(100vh-1.5rem)] w-full overflow-hidden rounded-[2rem] bg-[#f5f1ec] lg:grid-cols-[minmax(620px,1.18fr)_minmax(420px,0.82fr)]">
      <aside className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[#041f0b] px-6 py-7 text-white sm:px-10 sm:py-9 lg:px-14 lg:py-11">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(41,181,97,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(25,135,66,0.18),transparent_26%)]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e6f3a] text-white">
            <BoltIcon />
          </div>
          <span className="text-xl font-semibold tracking-tight">{eyebrow}</span>
        </div>

        <div className="relative max-w-[620px] py-8 lg:py-12">
          <h1 className="max-w-[600px] text-5xl font-semibold leading-[0.97] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.9rem]">
            {title}
          </h1>
          <p className="mt-7 max-w-[700px] text-lg leading-9 text-[#8ca095] sm:text-[1.05rem]">
            {description}
          </p>

          <div className="mt-12 grid grid-cols-3 gap-5 sm:max-w-[540px] sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-[#708273]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex items-center justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-10 xl:px-16">
        <div className="w-full max-w-[420px] xl:max-w-[430px]">{children}</div>
      </div>
    </section>
  );
}
