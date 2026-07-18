# Lift Management SaaS — Phase 1

Enterprise Lift Installation & AMC workflow platform. Architected for future multi-tenancy;
Phase 1 runs with a static `TenantId = 1` / `OrganizationId = 1` resolved through a
`TenantContext` middleware (never hardcoded in business logic).

## Stack

- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, React Hook Form, Zod, TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL + Prisma
- **Auth**: JWT (access + refresh, httpOnly cookie)
- **Storage**: AWS S3
- **Email**: AWS SES

## Monorepo Layout

```
apps/backend      Express API (Clean Architecture: Controller → Service → Repository → Prisma)
apps/frontend      Next.js App Router client
packages/shared-types   Shared Zod schemas / DTOs used by both apps
```

## Getting Started (Local, without Docker)

```bash
# 1. Install dependencies (from repo root)
npm install

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# 3. Start Postgres (or point DATABASE_URL at an existing instance)

# 4. Generate Prisma client (once schema exists — Module 2)
npm run prisma:generate

# 5. Run backend and frontend in separate terminals
npm run dev:backend    # http://localhost:4000/health
npm run dev:frontend   # http://localhost:3000
```

## Getting Started (Docker)

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

docker compose up --build
```

- Backend: http://localhost:4000
- Frontend: http://localhost:3000
- Adminer (DB UI): http://localhost:8080

## Module Delivery Plan

| # | Module | Status |
|---|--------|--------|
| 1 | Docker + env + project scaffolding | ✅ Complete |
| 2 | Prisma schema + seed data | ✅ Complete |
| 3 | Core infra: logger, error handler, response wrapper, tenant middleware, DI container | ✅ Complete |
| 4 | Auth module (JWT + refresh) + RBAC middleware | ✅ Complete |
| 5 | Users, Customers, Sites, Lifts, Master Data | ✅ Complete |
| 6 | Installation workflow (backend) | ✅ Complete |
| 7 | AMC workflow (backend) | ✅ Complete |
| 8 | File upload (S3) + Audit log | ✅ Complete (scoped down — see notes) |
| 9 | Frontend scaffolding (shadcn install, api-client, TanStack Query) | ✅ Complete |
| 10 | Frontend: Installation workflow screens | ✅ Complete |
| 11 | Frontend: AMC workflow screens | ✅ Complete |
| 12 | Backend v2 schema additions (Lead, Quotation, ServiceTicket, MaterialRequest, InventoryStock, Vendor, VendorPurchaseOrder, Invoice, BreakdownEscalation + seed-v2) | ✅ Complete |
| 13 | Leads/Quotation backend + frontend (Installation & AMC lead pipeline, site survey, GAD design) | ✅ Complete |
| 14 | Manufacturing/Dispatch backend + frontend extensions to Installation workflow | ✅ Complete |
| 15 | AMC v2 backend: Service Ticket, Material Request, Inventory, Vendor/PO, Invoice, Breakdown Escalation modules | ✅ Complete |
| 16 | Frontend: leads/quotations/site-survey/gad-design/manufacturing/dispatch screens | ✅ Complete |
| 17 | Frontend: AMC v2 screens (ticket triage/workload, inventory, vendor POs, invoices, escalations, AMC contract tier) | ✅ Complete |

## Multi-Tenancy Note

Every tenant-scoped Prisma model carries `tenantId` / `organizationId` columns from day one.
All repository methods accept `TenantContext` as an explicit parameter. Phase 2 swaps the
static middleware for JWT-claim resolution — no schema or service-layer changes required.

## Auth Endpoints (Module 4)

Base path: `http://localhost:4000/api/v1/auth`

| Method | Path       | Auth required | Notes |
|--------|------------|----------------|-------|
| POST   | `/login`   | No             | `{ email, password }` → access token in body, refresh token in httpOnly cookie |
| POST   | `/refresh` | No (cookie)     | Reads the refresh cookie, rotates it, returns a new access token |
| POST   | `/logout`  | No (cookie)     | Revokes the refresh token, clears the cookie |
| GET    | `/me`      | Yes (Bearer)    | Returns the current user + role + permissions |

Bootstrap credentials from the Module 2 seed: `admin@liftsaas.example.com` / `Admin@12345`
(rotate immediately in any real environment).

Route guards for future modules:
- `requireRoles('Admin', 'Manager')` — coarse role check
- `requirePermissions(['installation.create'])` — fine-grained, checked against the
  permission snapshot embedded in the access token at login

## Module 5 Endpoints

Base path: `http://localhost:4000/api/v1`. All routes require `Authorization: Bearer <accessToken>`
except where noted; every list endpoint supports `?page&limit&sortBy&sortOrder&search`.

| Resource | Base path | Permission (view / manage) |
|---|---|---|
| Users | `/users` | `users.manage` for all actions |
| Statuses | `/master-data/statuses` | `masterdata.view` / `masterdata.manage` |
| Lift Types | `/master-data/lift-types` | `masterdata.view` / `masterdata.manage` |
| Service Types | `/master-data/service-types` | `masterdata.view` / `masterdata.manage` |
| Customers | `/customers` | `customer.view` / `customer.manage` |
| Sites | `/sites` | `customer.view` / `customer.manage` (belongs to a Customer) |
| Lifts | `/lifts` | `lift.view` / `lift.manage` (belongs to a Site; references LiftType + Status) |

Each resource: `GET /` (list), `GET /:id`, `POST /`, `PATCH /:id`; Users/Customers/Sites/Lifts also
have `DELETE /:id` (soft delete). Master data has no delete — only `isActive` toggling via `PATCH`,
since many workflow records reference it by foreign key.

**Note:** added a `lift.manage` permission (granted to Admin + Manager) to the Module 2 seed to
support this module's Lift CRUD — re-run `npm run prisma:seed` to pick it up.

## Module 6 Endpoints — Installation Workflow

| Resource | Base path | Notes |
|---|---|---|
| Installation Projects | `/installation-projects` | CRUD + `POST /:id/complete` |
| Installation Tasks | `/installation-tasks` | CRUD, requires `?installationProjectId=` on list |
| Installation Milestones | `/installation-milestones` | CRUD + `POST /:id/sign-off` |
| Checklist Items | `/checklist-items` | Shared/polymorphic — see below |

**Completing a project** (`POST /installation-projects/:id/complete`) is the key workflow moment:
it creates the actual `Lift` record (from the project's chosen `liftTypeId` + `siteId`, plus a
`serialNumber` you supply), links `liftId` back onto the project, and flips the project to its
`COMPLETED` status — all inside one Prisma transaction (`installation-project.repository.ts`,
`completeWithLift`). A project can only be completed once (`liftId` must still be null).

**Task status → `completedAt`**: updating an `InstallationTask`'s `statusId` to whichever status
row has `code: "COMPLETED"` automatically stamps `completedAt`.

**Checklist items are polymorphic** (`entityType` + `entityId`, from the Module 2 schema) so the
same table/module serves both Installation and AMC. Right now `CHECKLIST_ENTITY_TYPES` only allows
`"INSTALLATION_TASK"` — Module 7 will add `"AMC_VISIT"` to that one array in
`checklist.validation.ts` and extend the parent-existence switch in `checklist.service.ts`,
with no new tables or duplicated CRUD code. `PATCH /checklist-items/:id` with `isChecked: true`
auto-stamps `checkedById`/`checkedAt` from the current user.

## Module 7 Endpoints — AMC Workflow

| Resource | Base path | Notes |
|---|---|---|
| AMC Contracts | `/amc-contracts` | CRUD. Validates `liftId` belongs to a site owned by `customerId` |
| AMC Schedules | `/amc-schedules` | CRUD (no delete) + `POST /generate` bulk action |
| AMC Visits | `/amc-visits` | CRUD. `liftId` must match the contract's own lift |

**Schedule generation** (`POST /amc-schedules/generate`, body `{ amcContractId, serviceTypeId? }`):
creates `numberOfServicesPerYear` evenly spaced `PLANNED` schedules across the contract's
`[startDate, endDate]` window in one `createMany` call.

**Visit → Schedule cascade**: updating an `AmcVisit`'s `statusId` to the `COMPLETED` status code,
when that visit is linked to an `AmcSchedule`, automatically marks the schedule `COMPLETED` too —
no separate manual step to keep the two in sync.

**AMC visit `PATCH` permission** is intentionally `any-of` (`amc.update`, `amc.assign`,
`amc.visit.log`) rather than field-scoped: managers editing details, whoever assigns a technician,
and the technician logging findings all hit the same route. Field-level enforcement (e.g. only
`amc.assign` may set `technicianId`) can be added later if it becomes necessary.

**Checklist module extended to AMC** (fulfilling the plan from Module 6): `CHECKLIST_ENTITY_TYPES`
now includes `"AMC_VISIT"` alongside `"INSTALLATION_TASK"` — same table, same CRUD, zero
duplication. Because `list`/`create` know `entityType` up front (query/body) but `update`/`delete`
only learn it after fetching the item by id, permission enforcement is split accordingly:
`checklist-permission.middleware.ts` (new this module) handles list/create with a static
entityType→permission map, while `checklist.service.ts` enforces the same map internally for
update/remove.

## Module 8 Endpoints — File Upload (S3)

Cost/scope note: no new npm packages were added (the AWS SDK was already scaffolded in Module 1),
no monitoring/APM tooling was introduced, and the audit-log reporting API originally planned for
this module was dropped — the existing `req.audit.log()`/`.activity()` writes (Module 3, used
throughout) already give you a queryable trail in Postgres at zero extra cost; a dedicated
reporting endpoint wasn't needed by either workflow, so it was cut rather than built and unused.

| Route | Method | Notes |
|---|---|---|
| `/files?entityType=&entityId=` | GET | Lists attachments with short-lived (15 min) presigned view URLs generated on the fly |
| `/files/presign-upload` | POST | Returns a presigned S3 PUT URL (5 min expiry); client uploads the file bytes directly to S3 |
| `/files/confirm-upload` | POST | Client calls this after the S3 PUT succeeds; only now does a `FileAsset` row get written |
| `/files/:id` | DELETE | Deletes the S3 object, then the DB row |

**Why presigned URLs instead of routing uploads through the API**: file bytes never touch our
Node process — no multer/streaming middleware, no server bandwidth or memory cost, and it scales
to large files without touching server resources. This is the standard AWS-recommended pattern
and keeps the AWS bill to just S3 storage + the (negligible) presigned-URL requests, no Lambda,
CloudFront, or Rekognition involved. AWS S3 includes 5GB/12 months free tier for new accounts,
which comfortably covers development.

**Supported `entityType`s**: `INSTALLATION_PROJECT` (completion certificates), `INSTALLATION_MILESTONE`
(sign-off evidence), `AMC_VISIT` (visit reports/photos) — each validated against its real parent
record before a presigned URL is ever issued. 25MB per-file cap enforced in validation to keep
storage costs predictable. `AWS_S3_BUCKET_NAME` etc. are read from `.env`; if unset, upload routes
fail clearly with a 500 rather than the whole server refusing to boot — so you don't need real AWS
credentials just to run the rest of the API in development.

## On "latest technologies" / dependency freshness

All `package.json` dependencies use caret ranges (`^`), so `npm install` pulls the latest
compatible minor/patch releases automatically. Since this project can't reach npm from within
this build environment to verify exact current versions, run this once after cloning to catch
anything newer that a caret range wouldn't auto-select (major version bumps):

```bash
npm outdated --workspaces
```

Review before bumping majors (Next.js 14→15, Express 4→5, etc. can carry breaking changes) —
but everything is intentionally kept on recent, actively maintained major versions already
(Next.js 14 App Router, Prisma 5, Zod 3, TypeScript 5, Node 20+, AWS SDK v3).

## Module 9 — Frontend Scaffolding

**No new npm packages** — everything used (axios, TanStack Query, react-hook-form, zod,
class-variance-authority, radix primitives, lucide-react) was already scaffolded in Module 1.

**Auth wiring**:
- `src/lib/api-client.ts` — axios instance; access token held in memory only (never
  localStorage), attached via request interceptor; a response interceptor catches 401s and
  transparently refreshes via the httpOnly cookie (single-flight — concurrent 401s share one
  refresh call), retrying the original request once.
- `src/providers/auth-provider.tsx` — on mount, attempts one silent `/auth/refresh` to
  re-establish a session from the httpOnly cookie after a hard page reload.
- `(dashboard)/layout.tsx` guards its routes **client-side** (redirects to `/login` if
  `useAuth()` resolves to no user). I deliberately did *not* add Next.js middleware to check
  the refresh cookie at the edge — in local dev the backend (`:4000`) and frontend (`:3000`)
  are different origins, so the backend's httpOnly cookie is never visible to frontend
  middleware anyway. Building that check would have been non-functional security theater;
  client-side guarding is the honest approach here given this topology.

**Design**: rather than the default shadcn gray/blue theme, tokens in `globals.css` use a
graphite + safety-amber palette (evokes equipment/hazard signage, fits a lift-maintenance
domain) with a dark "control-panel" sidebar. Typography: Space Grotesk (display) + Inter (body)
+ JetBrains Mono (equipment tags/serial numbers), loaded via `next/font/google` — no extra
package, built into Next.js.

**Shared types**: `packages/shared-types` now exports the `ApiResponse` envelope and core DTOs
(`SafeUser`, `CustomerDto`, `LiftDto`, etc.) consumed by the frontend, so both sides agree on
shape without duplicating it — `next.config.mjs` has `transpilePackages` set so Next.js compiles
this workspace package directly (no build step needed).

**Nav links to `/installation-projects`, `/amc-contracts`, `/customers`, `/lifts`, etc. currently
404** — those screens are Module 10/11. The shell, auth, and data-fetching plumbing are ready for
them.

## Module 10 — Frontend Installation Workflow Screens

**27 files, no new npm packages** (Select/Dialog/Toast/Textarea/Skeleton primitives use Radix
packages already declared in Module 1's `package.json`).

**New shadcn primitives**: `select.tsx`, `dialog.tsx`, `toast.tsx` + `toaster.tsx` + `use-toast.ts`
(lightweight custom toast state — no external store library), `textarea.tsx`, `skeleton.tsx`.

**API layer** (`src/lib/api/`): typed functions per resource (installation-projects, -tasks,
-milestones, checklist-items, plus read-only master-data lookups for dropdowns), all unwrapping
the backend's `ApiResponse` envelope via one shared `unwrap()`/`unwrapList()` helper.

**Query hooks** (`src/hooks/queries/`): one file per resource, TanStack Query `useQuery` for reads
and `useMutation` (with cache invalidation + toast on success/error) for writes.

**Screens**:
- `/installation-projects` — search, status filter, paginated table
- `/installation-projects/new` — create form with cascading Customer→Site select (site list
  refetches and resets when customer changes), lift type / status / engineer dropdowns
- `/installation-projects/[id]` — project header with status badge, **Complete Project** dialog
  (hidden once a Lift is linked), Tasks panel (inline status change, expandable checklist with
  add/toggle/delete), Milestones panel (add + sign-off)

**Note on Next.js version**: this project pins Next.js 14.2 / React 18.3 in `package.json`. I
initially wrote the `[id]/page.tsx` dynamic route using Next 15's `params: Promise<...>` + `use()`
pattern out of habit, caught that `use()` isn't stable in React 18.3, and corrected it to Next 14's
synchronous `params` prop before finalizing this module.

## Module 11 — Frontend AMC Workflow Screens

**16 files, no new npm packages.** Mirrors Module 10's pattern exactly (API layer → query hooks →
pages/dialogs), reusing `StatusBadge`, `PaginationControls`, `Skeleton`, `Toast`, and — notably —
the exact same checklist hooks from Module 10 (`use-checklist-items.ts`), just called with
`entityType: 'AMC_VISIT'` instead of `'INSTALLATION_TASK'`. This is the payoff of the polymorphic
checklist design from the backend: zero new checklist code needed on the frontend either.

**Screens**:
- `/amc-contracts` — search, status filter, paginated table
- `/amc-contracts/new` — create form with a three-level cascade: Customer → Site → Lift (each
  select resets and refetches when its parent changes)
- `/amc-contracts/[id]` — contract header + info cards, **Service schedule** panel with
  "Generate schedule" (calls the backend's even-spacing bulk generator), **Visits** panel with
  "Schedule visit" (optionally linking to a `PLANNED` schedule), inline status change per visit,
  a **Log findings** dialog (findings/actions taken/next service date), and the same expandable
  checklist UI as Installation tasks.

This completed the originally-scoped 11-module delivery plan (Docker/scaffolding through both
workflows' frontend screens). The project was subsequently extended with Modules 12–17 below,
covering the Lead/Quotation pipeline, Manufacturing/Dispatch, and a v2 AMC subsystem
(Service Tickets, Inventory, Vendors, Invoices, Breakdown Escalations).

## Modules 12–17 — Lead/Quotation Pipeline, Manufacturing/Dispatch, AMC v2

These modules follow the same Controller → Service → Repository → Prisma / API-layer →
query-hooks → screens pattern established in Modules 1–11. Routes are documented at the
module-file level rather than reproduced as full tables here — see
`apps/backend/src/modules/*/`.routes.ts` for each resource's exact paths and permissions, and
`apps/backend/src/prisma/seed-v2.ts` for the v2 status codes referenced below.

**Module 12 — Backend v2 schema additions**: new Prisma models — `Lead`, `Quotation`,
`ServiceTicket`, `MaterialRequest`, `InventoryStock`, `Vendor`, `VendorPurchaseOrder`, `Invoice`,
`BreakdownEscalation` — plus their `Status` and `Permission` rows, seeded separately in
`seed-v2.ts` (kept apart from the Module 2 `seed.ts` so the original seed stays untouched).

**Module 13 — Leads/Quotation backend + frontend**: Installation & AMC lead intake pipeline
through site survey and GAD (General Arrangement Drawing) design sign-off, ending in a
`Quotation` a customer can accept.

**Module 14 — Manufacturing/Dispatch**: extends the Installation workflow past project creation
with manufacturing-stage tracking and dispatch confirmation, both backend and frontend.

**Module 15 — AMC v2 backend**: `ServiceTicket` (breakdown/complaint intake → triage →
technician assignment → visit → resolution → close, with automatic `BreakdownEscalation`
creation when a lift accumulates 3+ closed tickets within a 60-day window), `MaterialRequest`
(raised against a ticket, approve → issue-from-stock or raise-a-vendor-PO), `InventoryStock`
(BIS/ISI-certified parts stock with reorder-level tracking), `Vendor` + `VendorPurchaseOrder`
(send → acknowledge → GRN receipt), `Invoice` (billing against an AMC contract), and
`BreakdownEscalation` (review queue with an acknowledge action resolving to either
`RESOLVED_IN_AMC` or `ROUTED_TO_MODERNIZATION`).

**Module 16 — Frontend, Installation side**: list/create/detail screens for leads, quotations,
site survey, GAD design, manufacturing, and dispatch — same list-page/detail-page/dialog
conventions as Module 10.

**Module 17 — Frontend, AMC v2 side**: 
- `/service-tickets` — triage board with search/status filter; `[id]` detail page with
  status-conditional action dialogs (categorize → assign → start visit → resolve → close), plus a
  "Material requests" panel to raise MRDs against the ticket
- `/service-tickets/workload` — technician workload board, one column per `TECHNICIAN`-role user
  plus an "Unassigned" column
- `/inventory` — stock list (low-stock filter, reorder-level highlighting), create/adjust dialogs
- `/material-requests` — MRD list with status-conditional actions (approve, issue from stock,
  raise PO, reject)
- `/vendors` + `/vendor-purchase-orders` — vendor CRUD, PO list with send/receive-GRN actions
- `/invoices` — billing screen against AMC contracts, line-item creation, send/mark-paid actions
- `/escalations` — breakdown escalation review queue with an acknowledge dialog

**AMC contract tier**: `AmcContract` gained a `tier` field (`BASIC | STANDARD | PREMIUM`,
nullable) threaded through the Prisma schema, validation, repository, shared DTO, the contract
create form, and a new "Edit tier" dialog on `/amc-contracts/[id]`.

See `PROJECT_HANDOFF.md` for a full context summary if continuing this project in a new
conversation — including the **known gap that a real `npm install && npm run typecheck` has not
yet been run** against Modules 12–17 (no shell/build access was available while writing them;
verification was done by manual code reading against the Prisma schema and existing DTOs).
