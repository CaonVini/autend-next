export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#1f2937,_#020617_55%)] px-6 py-16 text-slate-50">
      <section className="w-full max-w-5xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur md:p-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-medium text-emerald-200">
              Next.js + TypeScript + Tailwind + Docker
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Projeto inicial pronto para evoluir com app web e servicos locais.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                A aplicacao foi criada com App Router, TypeScript e Tailwind CSS 4.
                Tambem deixei a stack local preparada com PostgreSQL e Redis via
                Docker Compose.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Frontend</p>
                <p className="mt-2 text-xl font-semibold">Next 16</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Banco principal</p>
                <p className="mt-2 text-xl font-semibold">PostgreSQL 16</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-sm text-slate-400">Cache e filas</p>
                <p className="mt-2 text-xl font-semibold">Redis 7</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-6">
            <h2 className="text-lg font-semibold">Comandos iniciais</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-black/40 p-4 font-mono text-slate-200">
                cp .env.example .env.local
              </div>
              <div className="rounded-xl bg-black/40 p-4 font-mono text-slate-200">
                docker compose up -d
              </div>
              <div className="rounded-xl bg-black/40 p-4 font-mono text-slate-200">
                npm run dev
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              O `docker-compose.yml` sobe os dois servicos com volumes persistentes,
              healthchecks e portas padrao expostas localmente.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
