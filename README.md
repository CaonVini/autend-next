# Autend Next Starter

Projeto base com:

- Next.js 16
- TypeScript
- Tailwind CSS 4
- PostgreSQL via Docker Compose
- Redis via Docker Compose

## Requisitos

- Node.js 20+
- Docker + Docker Compose

## Como rodar

1. Instale as dependencias:

```bash
npm install
```

2. Copie as variaveis de ambiente:

```bash
cp .env.example .env.local
```

3. Suba o PostgreSQL e o Redis:

```bash
docker compose up -d
```

4. Rode a aplicacao:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Servicos locais

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Variaveis uteis

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/autend`
- `REDIS_URL=redis://localhost:6379`
