# Deputeti AI Frontend

Next.js app for Deputeti AI (Albanian/EU law chat, library, explorer, compare).

App auth (signup/login) uses a **Supabase (Postgres)** database. The chat answers with **Claude** (Anthropic API), which searches the web for current EU and Albanian law texts and shows the pages it cites as sources. Library, Explorer and Compare depended on the old `eu-law.deputeti.ai` backend and are currently redirected to the chat.

## Features

- Email/password signup and login (httpOnly session cookie)
- Supabase Postgres user store (`db/schema.sql`)
- Per-user chat history stored in Supabase (not shared across accounts)
- Chat, library, explorer, and compare UIs
- Chat via Claude with web search (official sources preferred: EUR-Lex, qbz.gov.al, parlament.al)

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill in values:

```bash
cp .env.example .env
```

Required:

- `DATABASE_URL` (Supabase)
- `ANTHROPIC_API_KEY`

3. Set `DATABASE_URL` to your Supabase connection string. Tables from [`db/schema.sql`](db/schema.sql) are created automatically on the first request. To create them up front instead:

```bash
npm run db:init
```

(or paste `db/schema.sql` into the Supabase SQL Editor).

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account at `/signup`, then sign in.

### Auth flow

1. Sign up or log in with email + password
2. Session is stored in an httpOnly cookie (`deputeti_session`)
3. Protected pages (`/chat`, `/library`, `/explorer`, `/compare`) require that session
4. `/api/chat` verifies the session, then calls Claude with the conversation history

### Build

```bash
npm run build
npm start
```

## Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase Postgres connection string (transaction pooler, port 6543) |
| `SESSION_SECRET` | App secret for production hardening |
| `ANTHROPIC_API_KEY` | Anthropic API key for the chat (server-only) |

Tables are created automatically on the first request, so no manual migration step is needed.

## Deploying to Vercel

1. Create a Supabase project and copy its **Transaction pooler** connection string (port 6543).
2. Import the GitHub repo in Vercel.
3. Add the environment variables from the table above (`DATABASE_URL`, `ANTHROPIC_API_KEY`).
4. Deploy, then create an account at `/signup`.

## Deployment notes

- Never expose `ANTHROPIC_API_KEY` to the browser (never prefix it with `NEXT_PUBLIC_`).
- Set a strong `SESSION_SECRET` in production.
