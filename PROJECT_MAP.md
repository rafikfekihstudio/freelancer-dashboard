# PROJECT_MAP

## PROJECT_INFO

- Name: Freelancer Dashboard
- Type: SaaS Dashboard (Single-Tenant)
- Status: Complete — Simplified Model
- Start Date: 2026-05-08

---

# TECH_STACK

## Frontend

- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- shadcn/ui (as needed)

## Backend

- Next.js API Routes / Server Actions
- Auth.js v5 (NextAuth)
- Zod (validation)

## Database

- SQLite via better-sqlite3
- Drizzle ORM

## Infrastructure

- Local filesystem (image uploads)
- Node.js 22

## Tooling

- TypeScript 5
- ESLint
- Prettier (config)

---

# SYSTEM_FLOW

## User Journey

1. Admin creates agency/freelancer accounts manually
2. User logs in with email + password
3. Role-based dashboard redirect:
   - freelancer → work entry CRUD
   - agency → read-only view + comments
   - admin → user management
4. Freelancer uploads image + fills metadata → work entry created
5. Agency views entries, leaves comments

## API Flow

- Server Actions for all mutations
- RSC data fetching for reads
- Auth.js session for authentication

## Background Jobs

- None currently

---

# ARCHITECTURE

## Domains

- **Auth** — login, session, role
- **Users** — admin creates/deletes agency/freelancer accounts
- **Works** — work entries, image upload, metadata
- **Comments** — agency comments on work entries

## Shared/Core

- `lib/db/` — Drizzle schema + connection
- `lib/auth.ts` — Auth.js config
- `lib/actions/` — Server Actions per domain
- `components/ui/` — shared UI primitives

## Data Flow

- All state derived from SQLite DB
- RSC fetches on every navigation
- Server Actions mutate → revalidate path

## State Management

- No client state library; RSC + Server Actions
- Forms use React `useActionState`

---

# ACTIVE_FEATURES

- [x] M1: Project scaffold (Next.js, Drizzle, Auth.js, layout)
- [x] M2: User management (admin create/delete users, login)
- [x] M3: Freelancer workspace (work entry CRUD, image upload, status toggle)
- [x] M4: Agency view (read-only entries, comments)
- [x] M5: Extended domain model (client/sub, payments, financial views)
- [x] M5: Polish & verify

---

# ORPHANS & PENDING

- [x] Seed script for initial admin user
- [ ] Image size validation + optimization
- [ ] Error boundaries per route group
- [ ] Loading skeletons
- [ ] Email notifications for new work/comments

---

# KNOWN_RISKS

- SQLite concurrent writes (low risk for single-tenant)
- Local uploads: disk space (low risk, monitor)
- Auth.js credential provider: limited to email-password (sufficient)

---

# CHANGE_LOG

## 2026-05-08

- Initialized PROJECT_MAP
- M1 scaffold complete (Next.js 16, Drizzle+SQLite, Auth.js v5, login, admin user mgmt)

## 2026-05-10

- Simplified to 2 entities: retoucher ↔ hirer
- Removed: freelancer/agency/subcontractor roles, clientPrice/subCost/subcontractorId
- Added: edit work entry feature (`/retoucher/works/[id]/edit`)
- Added: monthly payment history ordering
- Routes: /retoucher/*, /hirer/*
- Admin seed: admin@dashboard.com / admin123
