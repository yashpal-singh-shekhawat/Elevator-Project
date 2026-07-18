# Lift Management SaaS — Project Handoff / Context Document

**Purpose of this file**: Paste/upload this file (along with the project zip) into a NEW Claude
conversation to continue this project with full context. Claude reading this should understand
exactly what's been built, why, and what's next — without needing the original conversation history.

---

## 1. What this project is

Enterprise Lift Installation & AMC (Annual Maintenance Contract) management SaaS. Phase 1 scope
is deliberately limited to **two workflows only**: Lift Installation and AMC. Architected to
become multi-tenant later with minimal changes, but Phase 1 runs as a single tenant
(`tenantId = 1`, `organizationId = 1`).

## 2. Tech stack

- **Backend**: Node.js, Express, TypeScript, Prisma + PostgreSQL, JWT auth (access + httpOnly
  refresh cookie, rotation), AWS S3 (presigned URLs), AWS SES (not yet wired)
- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui (hand-written source,
  not CLI-installed), React Hook Form + Zod, TanStack Query, axios
- **Monorepo**: npm workspaces — `apps/backend`, `apps/frontend`, `packages/shared-types`

## 3. Architecture principles (followed throughout — keep these when adding code)

- **Clean Architecture** on the backend: Controller → Service → Repository → Prisma. Never skip
  a layer.
- **Multi-tenancy-ready, not multi-tenant yet**: every tenant-scoped Prisma model has `tenantId`
  + `organizationId` columns. Every repository method takes a `TenantContext` object as an
  explicit parameter — never reads tenant ID from a global. `tenant.middleware.ts` currently
  injects a static `{tenantId:1, organizationId:1}`; Phase 2 swaps it for JWT-claim decoding with
  zero changes below the middleware.
- **RBAC is DB-driven, not hardcoded enums**: `Role`, `Permission`, `RolePermission` are seeded
  DB rows. Access tokens embed a permission-code snapshot at login.
  `requireRoles(...)`/`requirePermissions([...], {any?})` are the route guards.
  See `apps/backend/src/prisma/seed.ts` for the full permission matrix.
- **Statuses are master data, not hardcoded strings**: `Status` model, keyed by
  `(tenantId, entityType, code)`. Services look up status by entityType+code when they need to
  branch on it (e.g. checking if code === "COMPLETED").
- **Polymorphic reuse over duplication**: `ChecklistItem` and `FileAsset` use
  `entityType`+`entityId` so both Installation and AMC share one table/module instead of
  duplicating CRUD. When their manage-permission depends on entityType (known only after fetching
  the row, e.g. update/delete), the check lives in the *service*, not route middleware. When
  entityType is known up-front (list/create, from query/body), a small dynamic-permission
  middleware handles it (see `checklist-permission.middleware.ts` / `file-permission.middleware.ts`).
- **DI container**: `common/container.ts` — simple `register(token, factory)` / `resolve<T>(token)`,
  no decorators/reflect-metadata. **Import order in `app.ts` matters** — a module's router file
  registers its repository/service in the container as a side effect at import time; anything that
  depends on it must be imported *after*. If you add a new module, check what it depends on and
  place the import accordingly (there's a comment trail in `app.ts` showing the current order).
- **Soft delete** (`deletedAt`) on business entities that get referenced elsewhere; **no** soft
  delete on simple child records that don't need history (e.g. `ChecklistItem`, `AmcSchedule`) —
  check the Prisma schema before assuming a model has `deletedAt`.
- **Cost-consciousness** (explicit user requirement): no third-party monitoring/APM tools, no
  unnecessary paid services. S3 uses presigned URLs (no bytes through the server, no CDN, no
  Lambda). Audit logging is just Postgres writes (`AuditLog`/`ActivityLog` tables via
  `req.audit.log()`/`.activity()`), not a third-party service — there is no separate audit
  reporting API by design (was cut as unnecessary scope).
- **Frontend auth**: access token in memory only (never localStorage), refresh token in httpOnly
  cookie. `api-client.ts` has a single-flight 401-refresh-and-retry interceptor.
  `(dashboard)/layout.tsx` guards routes **client-side** — Next.js edge middleware was
  deliberately NOT used for auth because in local dev the frontend (`:3000`) and backend (`:4000`)
  are different origins, so the backend's httpOnly cookie is invisible to frontend middleware
  anyway; building that check would be non-functional.
- **Design tokens**: NOT default shadcn gray/blue. Deliberate graphite + safety-amber palette
  (`globals.css` CSS variables) fitting a lift-maintenance/industrial domain, dark sidebar
  ("control panel" look). Space Grotesk (display) + Inter (body) + JetBrains Mono (equipment
  tags/serials) via `next/font/google`.

## 4. Module delivery status

| # | Module | Status |
|---|--------|--------|
| 1 | Docker, env config, monorepo scaffolding | ✅ |
| 2 | Prisma schema (25 models) + seed | ✅ |
| 3 | Core infra: error handler, ApiResponse, tenant middleware, audit middleware, DI container | ✅ |
| 4 | Auth (JWT + refresh rotation) + RBAC middleware | ✅ |
| 5 | Users, Customers, Sites, Lifts, Master Data CRUD | ✅ |
| 6 | Installation workflow backend (Project/Task/Milestone + Checklist) | ✅ |
| 7 | AMC workflow backend (Contract/Schedule/Visit, checklist extended to AMC_VISIT) | ✅ |
| 8 | File upload (S3 presigned URLs). Audit reporting API deliberately cut (see above) | ✅ |
| 9 | Frontend scaffolding: auth wiring, TanStack Query, shadcn primitives, design tokens | ✅ |
| 10 | Frontend: Installation workflow screens (list/create/detail, tasks, milestones, checklist) | ✅ |
| 11 | Frontend: AMC workflow screens | ✅ |
| 12 | Backend v2 schema additions (Lead, Quotation, ServiceTicket, MaterialRequest, InventoryStock, Vendor, VendorPurchaseOrder, Invoice, BreakdownEscalation + seed-v2 status/permission seeds) | ✅ |
| 13 | Leads/Quotation backend + frontend (Installation & AMC lead pipeline, site survey, GAD design) | ✅ |
| 14 | Manufacturing/Dispatch backend + frontend extensions to Installation workflow | ✅ |
| 15 | AMC v2 backend: ServiceTicket, MaterialRequest, InventoryStock, Vendor/VendorPurchaseOrder, Invoice, BreakdownEscalation modules (Controller→Service→Repository→Prisma, each with its own routes) | ✅ |
| 16 | Frontend: Installation-side screens for leads/quotations/site-survey/gad-design/manufacturing/dispatch | ✅ |
| 17 | Frontend: AMC v2 screens — Service Ticket triage board + technician workload, Inventory + Material Request screens, Vendor + Purchase Order screens, Invoice/billing screen, Escalation review queue, AMC contract tier selection | ✅ |

Full endpoint-by-endpoint documentation is in the project's own `README.md` (updated after every
module) — read that for exact routes, permissions, and request/response shapes. **Note**: the
endpoint tables in `README.md` currently only cover Modules 4–8 in full detail; Modules 12–17
routes are documented at the module-file level (see `apps/backend/src/modules/*/`.routes.ts`
per resource) rather than reproduced as tables.

## 5. Known constraints of the build environment (matters if debugging)

- Code was written in a sandbox with **no network access** and **no `node_modules` installed** —
  nothing has been run through `npm install`, `tsc`, `prisma generate`, or `next build`. Every
  file was manually brace/paren-balance-checked, and Prisma relation names were cross-verified,
  but a real `npm install && npm run typecheck` should be the first thing done locally, and is
  likely to surface small issues (e.g. exact Prisma-generated type names) that couldn't be
  verified without the generated client.
- The person following this project runs Windows + Docker Desktop, communicates in Hindi/English
  mixed, and has already done local setup through Module 8 (their own `.env` files exist — don't
  assume defaults).

## 6. How work has been delivered

Each module was delivered as: (a) a full project zip, and (b) for later modules, a **delta zip**
containing only new/modified files (to avoid the person re-extracting and losing their local
`.env` edits) — with modified files given in full (safe to overwrite) and new files just added.
Continue this pattern.

## 7. Immediate next step

All 17 modules (the originally-scoped 11-module plan plus the Module 12–17 extension covering
Leads/Quotations, Manufacturing/Dispatch, and the AMC v2 subsystem — Service Tickets, Material
Requests, Inventory, Vendors/POs, Invoices, Breakdown Escalations) are now feature-complete on
both backend and frontend. Notable Module 17 decisions:
- `AmcContract` gained a `tier` field (`BASIC | STANDARD | PREMIUM`, nullable) — added to the
  Prisma schema, validation, repository, shared DTO, the contract create form, and a new
  "Edit tier" dialog on the contract detail page.
- Technician assignment (ticket `assign` action, workload view) uses the existing seeded
  `TECHNICIAN` role (`user.roleCode === 'TECHNICIAN'`), consistent with how `add-visit-dialog.tsx`
  already filtered technicians for AMC visits — no new role/field was introduced for this.
- Nav sidebar (`apps/frontend/src/app/(dashboard)/layout.tsx`) now includes Service Tickets,
  Inventory, Vendors, Invoices, and Escalations entries.

Natural follow-ups: wiring real AWS SES email notifications, a Customers/Sites/Lifts/Master-Data
admin UI (backend already exists, no frontend screens were ever planned for these), and getting a
real `npm install` + `prisma migrate` + `next build` run to shake out any issues the static
review couldn't catch.
