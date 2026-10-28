# Quick Start (local)

## 1. Install

```bash
npm install
cp .env.example .env
```

Fill `UPSTREAM_API_USERNAME` and `UPSTREAM_API_PASSWORD` in `.env` (server-only credentials for the law API).

## 2. Create the database

```bash
npm run db:init
```

Uses [`db/schema.sql`](db/schema.sql) and writes `data/deputeti.db`.

## 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign up** → use the app.

## Auth

- Email + password only
- Session cookie after login/signup
- Chat/library/compare stay on the upstream API; the Next.js server attaches the upstream JWT
