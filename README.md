# Florence

Florence is a staff web app for an event planning team. Planners choose five coordinated colors, assemble flower combinations, assign those colors to event elements, and print a client concept sheet.

This repository implements the P0 product described in `outputs/Florence_Build_Specification.md`.

## Stack

- Next.js 16.3.5 App Router, React 19.2.8, TypeScript
- Tailwind CSS 4, Radix primitives, Lucide icons
- Culori 4.0.2 for OKLCH generation and OKLab distance
- Zod 4.6.5 for payload validation
- Supabase Auth/Postgres for production persistence
- Vitest 5 and Playwright for tests

Exact versions are recorded in `package-lock.json`. Use `npm ci` in CI.

## Local demo

1. Copy `.env.example` to `.env.local` if needed. Demo mode is already enabled for local development.
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:3000`. The demo workspace opens on Projects.

Demo projects persist in `localStorage` on this device. The Garden Dinner fixture is seeded automatically.

Do not set `NEXT_PUBLIC_FLORENCE_DEMO=true` in production. A configured production app must not fall back to demo data when the backend fails.

## Scripts

- `npm run dev` — development server
- `npm run test` — unit tests
- `npm run lint` — ESLint
- `npm run build` — production build
- `npm run test:e2e` — Playwright (starts or reuses the dev server)

## Production setup

1. Create separate development and production Supabase projects.
2. Apply `supabase/migrations/0001_florence_p0.sql`.
3. Provision staff users and `workspace_members` rows with a deployment operator credential. There is no invitation UI in P0.
4. Set `NEXT_PUBLIC_FLORENCE_DEMO=false` or omit it.
5. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_ORIGIN`.
6. Host on a Vercel plan suitable for commercial use. The Hobby plan is not appropriate for this company tool.

Service-role keys, database passwords, and privileged migration credentials must stay in the operator environment. Never expose them as `NEXT_PUBLIC_` values.

## Backup

Use the selected Supabase plan’s backup and restore tools. Test restore on a non-production copy before storing live client projects. Schema changes must go through versioned SQL in `supabase/migrations`.

## Content still required before a pilot

- Company name and brand assets
- Licensed flower photography to replace placeholders
- Florist-reviewed catalog corrections
- Preferred currency and time zone
- Initial staff access list
