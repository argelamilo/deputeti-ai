# Deputeti AI Frontend

Next.js app for Deputeti AI (Albanian/EU law chat, library, explorer, compare).

App auth (signup/login) uses a **local SQLite** database. Chat/library/compare still proxy to the upstream law API (`eu-law.deputeti.ai`) using server-side credentials.

## Features

- Email/password signup and login (httpOnly session cookie)
- Local SQLite user store (`db/schema.sql`)
- Per-user chat history stored in SQLite (not shared across accounts)
- Chat, library, explorer, and compare UIs
- BFF API routes that attach upstream JWT on the server

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

Required for upstream chat/library/compare:

- `UPSTREAM_API_USERNAME`
- `UPSTREAM_API_PASSWORD`

3. Create the local database from the single SQL schema:

```bash
npm run db:init
```

This creates `data/deputeti.db` from [`db/schema.sql`](db/schema.sql). You can also apply the schema manually:

```bash
sqlite3 data/deputeti.db < db/schema.sql
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account at `/signup`, then sign in.

### Auth flow

1. Sign up or log in with email + password
2. Session is stored in an httpOnly cookie (`deputeti_session`)
3. Protected pages (`/chat`, `/library`, `/explorer`, `/compare`) require that session
4. BFF routes verify the session, then call the upstream API with a cached service JWT

### Build

```bash
npm run build
npm start
```

## Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_PATH` | Path to SQLite file (default `./data/deputeti.db`) |
| `SESSION_SECRET` | App secret for production hardening |
| `API_BASE_URL` / `NEXT_PUBLIC_API_URL` | Upstream law API base URL |
| `UPSTREAM_API_USERNAME` / `UPSTREAM_API_PASSWORD` | Server-only upstream login |
| `NEXT_PUBLIC_CHAT_MODEL` | Chat model label |

SQLite is intended for local development. A hosted database would be needed for multi-instance production later.

## Deployment notes

- Ensure `npm run db:init` (or equivalent) runs where the app can write the SQLite file, or point `DATABASE_PATH` at a persistent volume.
- Never expose `UPSTREAM_API_*` to the browser.
- Set a strong `SESSION_SECRET` in production.
