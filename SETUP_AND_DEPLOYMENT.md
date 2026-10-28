# Frontend Setup & Deployment Guide

**SHFA Analytics Platform - Frontend**
**Version**: 2.0
**Last Updated**: January 2025
**Status**: Production Ready (Dependencies need installation)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Multi-Tenant Support](#multi-tenant-support)
3. [Quick Start](#quick-start)
4. [Environment Configuration](#environment-configuration)
5. [Development](#development)
6. [Production Deployment](#production-deployment)
7. [Dashboard System](#dashboard-system)

---

## Architecture Overview

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.0.1 |
| **UI Library** | React | 19.2.0 |
| **Language** | TypeScript | 5.x |
| **Component Library** | Material-UI (MUI) | 7.3.4 |
| **Data Fetching** | TanStack Query | 5.90.5 |
| **HTTP Client** | Axios | 1.13.1 |
| **Charts** | Recharts | 3.3.0 |
| **Styling** | Tailwind CSS | 4.x |

### Key Features

✅ **Multi-Tenant Architecture** - Fully isolated tenant data
✅ **Authentication & Authorization** - JWT-based auth with automatic token refresh
✅ **Reusable Dashboard System** - Configurable widgets and layouts
✅ **React Query Integration** - Automatic caching, refetching, and state management
✅ **Responsive Design** - Mobile-first approach with Material-UI
✅ **Type Safety** - Full TypeScript coverage

---

## Multi-Tenant Support

### How It Works

The frontend is designed to be **100% reusable** across all tenants. Tenant isolation is achieved through:

1. **User Authentication** - Each user belongs to a single tenant
2. **Tenant ID in JWT Token** - User object contains `tenant_id`
3. **Automatic API Filtering** - All API requests include tenant context
4. **Row-Level Security** - Backend enforces data isolation

### User Model

```typescript
interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin' | 'superadmin';
  tenant_id: string;  // ← Tenant isolation
  is_active: boolean;
  created_at: string;
}
```

### Tenant Context Flow

```
User Login
    ↓
JWT Token with tenant_id
    ↓
AuthContext stores User (includes tenant_id)
    ↓
API requests automatically filtered by backend using tenant_id
    ↓
Dashboard shows only tenant's data
```

**No tenant switching UI needed** - Users can only see their own tenant's data.

---

## Quick Start

### Prerequisites

- Node.js 20+ (check: `node --version`)
- npm or yarn
- Backend API running (default: `http://localhost:8000`)

### 1. Install Dependencies

```bash
cd /Users/fc/Documents/fsha/SHFA-AI/app-2.0/frontend

# Install all dependencies
npm install

# This will install:
# - Next.js 16.0.1
# - React 19.2.0
# - Material-UI 7.3.4
# - TanStack Query 5.90.5
# - Axios, Recharts, and more
```

**Expected time**: ~2-3 minutes

### 2. Create Environment File

```bash
# Create .env.local file
cat > .env.local <<'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Analytics & Monitoring
# NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
# NEXT_PUBLIC_GA_ID=your_google_analytics_id
EOF
```

### 3. Run Development Server

```bash
npm run dev

# Server will start at:
# http://localhost:3000
```

### 4. Build for Production

```bash
npm run build
npm start
```

---

## Environment Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | - |
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | - |

### Environment Files

- `.env.local` - Local development (not committed)
- `.env.production` - Production settings
- `.env` - Shared defaults (committed)

**Security**: Never commit `.env.local` or API keys to git!

---

## Development

### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Home page
│   │   ├── login/             # Login page
│   │   └── providers.tsx      # React Query + Auth providers
│   ├── components/            # Reusable UI components
│   │   └── layout/            # Layout components
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts      # Axios client with auth
│   │   │   └── auth.ts        # Auth API methods
│   │   └── utils/             # Utility functions
│   └── types/                 # TypeScript definitions
│       ├── auth.ts            # Auth types
│       ├── dashboard.ts       # Dashboard types
│       ├── api.ts             # API types
│       └── kpi.ts             # KPI types
├── public/                    # Static assets
├── package.json              # Dependencies
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

### Authentication Flow

1. **User logs in** via `/login`
2. **AuthContext** handles login, stores JWT tokens
3. **APIClient** automatically attaches JWT to all requests
4. **Token refresh** happens automatically on 401 errors
5. **User object** stored in context (includes `tenant_id`)

### API Integration

#### Making API Calls

```typescript
import { apiClient } from '@/lib/api/client';

// GET request
const data = await apiClient.get('/metrics/revenue');

// POST request
const result = await apiClient.post('/orders', {
  /* data */
});
```

#### Using React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['revenue'],
    queryFn: () => apiClient.get('/metrics/revenue'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Revenue: ${data.value}</div>;
}
```

### Auto Token Refresh

The `APIClient` automatically handles:
- **401 errors** - Triggers token refresh
- **Refresh queue** - Prevents multiple simultaneous refresh requests
- **Redirect to login** - If refresh fails
- **Token storage** - In localStorage

No manual intervention needed!

---

## Production Deployment

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# Output: .next/ directory with optimized build

# 3. Start production server
npm start
```

### Deployment Options

#### Option 1: Vercel (Recommended)

Vercel is the creator of Next.js and provides seamless deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

**Pros**:
- Automatic deployments from Git
- Edge network (global CDN)
- Serverless functions
- Zero configuration

#### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t shfa-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-backend-api.com \
  shfa-frontend
```

#### Option 3: Traditional Server (PM2)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "shfa-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Environment Variables in Production

**Vercel/Netlify**: Set in dashboard
**Docker**: Pass via `-e` flag or `.env` file
**PM2**: Use ecosystem file

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'shfa-frontend',
    script: 'npm',
    args: 'start',
    env: {
      NEXT_PUBLIC_API_URL: 'https://api.yourcompany.com'
    }
  }]
};
```

---

## Dashboard System

### Reusable Dashboard Architecture

The frontend implements a **fully reusable dashboard system** that works for all tenants:

#### Widget Types

- **KPI Cards** - Single metric with trend
- **Charts** - Line, area, bar, pie charts
- **Tables** - Sortable, filterable data tables
- **Grids** - Custom grid layouts

#### Dashboard Configuration

Dashboards are configured via JSON from the backend:

```typescript
interface DashboardConfig {
  id: string;
  name: string;
  tenant_id: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  filters?: DashboardFilter[];
}
```

### Bond Collective Dashboard Example

See [BOND_DASHBOARD_INTEGRATION.md](./BOND_DASHBOARD_INTEGRATION.md) for complete implementation details including:

- Type definitions
- API service layer (19 Bond metrics)
- React Query hooks
- Reusable components
- Full dashboard page implementation

---

## Common Tasks

### Adding a New Page

```bash
# Create new page file
mkdir -p src/app/my-page
cat > src/app/my-page/page.tsx <<'EOF'
export default function MyPage() {
  return <div>My New Page</div>;
}
EOF
```

Access at: `http://localhost:3000/my-page`

### Adding a New API Endpoint

```typescript
// src/lib/api/my-service.ts
import { apiClient } from './client';

export const myService = {
  getData: async () => {
    return apiClient.get('/my-endpoint');
  },

  postData: async (data: any) => {
    return apiClient.post('/my-endpoint', data);
  },
};
```

### Creating a New Component

```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

---

## Troubleshooting

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Errors

1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors

### Authentication Issues

1. Clear localStorage: `localStorage.clear()`
2. Check JWT token validity
3. Verify backend auth endpoints are working

### Build Errors

```bash
# Type check
npx tsc --noEmit

# Lint check
npm run lint
```

---

## Next Steps

1. ✅ **Install dependencies**: `npm install`
2. ✅ **Configure environment**: Create `.env.local`
3. ✅ **Run development server**: `npm run dev`
4. ⚠️ **Implement Bond dashboard**: See [BOND_DASHBOARD_INTEGRATION.md](./BOND_DASHBOARD_INTEGRATION.md)
5. ⚠️ **Test with backend API**: Ensure backend is running
6. ⚠️ **Deploy to production**: Choose deployment option

---

## Resources

### Documentation

- **Bond Dashboard Integration**: [BOND_DASHBOARD_INTEGRATION.md](./BOND_DASHBOARD_INTEGRATION.md)
- **Backend API Docs**: [../backend/docs/README.md](../backend/docs/README.md)
- **Authentication Guide**: [../backend/docs/AUTH_GUIDE.md](../backend/docs/AUTH_GUIDE.md)

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/material-ui/getting-started/)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Ready to Run?**

```bash
cd /Users/fc/Documents/fsha/SHFA-AI/app-2.0/frontend
npm install
npm run dev
```

Frontend will be available at **http://localhost:3000**

---

**Multi-Tenant Scalability**: ✅ Fully Implemented
**Authentication**: ✅ JWT with Auto-Refresh
**Dashboard System**: ✅ Reusable Architecture
**Type Safety**: ✅ Full TypeScript Coverage
**Production Ready**: ⚠️ Needs `npm install` + environment config
