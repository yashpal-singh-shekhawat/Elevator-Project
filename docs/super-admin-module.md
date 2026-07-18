# Super Admin (Platform) Module — MVP Reference

Status: **complete** (MVP). Branding: **ForceLift**. Phase: MVP.

This documents the Super Admin module refactor so it can be resumed/extended later.
Everything reuses existing architecture — no AWS, no new infra.

---

## 1. What changed & why

The Super Admin module was upgraded from a bare "list + create" screen into a
professional platform console (dashboard + tenant management) matching the
ForceLift reference prototype. Tenants gained a company profile (contact person,
email, phone, address, logo).

**Multi-tenancy note:** tenant users are JWT-isolated (`req.tenantContext` is
derived from JWT claims — the "make TenantContext dynamic" work is done). Super
Admin is *platform-scoped* by design: it manages ALL tenants and correctly has
NO tenant context (separate `PlatformUser` table, JWT `scope:'PLATFORM'`,
separate cookie `<REFRESH>_platform` on path `/api/v1/platform-admin/auth`).

---

## 2. Backend (apps/backend)

### Schema (`src/prisma/schema.prisma`)
`Tenant` model extended with: `contactPerson`, `email` (`@unique`), `phone`,
`address`, `logoUrl` (all nullable). `logoUrl` stores a RELATIVE path
(`/uploads/tenant-logos/...`). Swap to an S3 URL later with zero schema change.

**⚠️ Requires migration + client regen (not yet run — shell was down):**
```
npm run prisma:migrate --workspace=@lift-saas/backend      # prisma migrate dev
npm run prisma:generate --workspace=@lift-saas/backend
npm run prisma:seed --workspace=@lift-saas/backend          # NOT "npm run seed"
```

### Logo storage (`src/common/utils/tenant-logo-storage.ts`) — NEW
`saveTenantLogo(dataUrl, slug)`: decodes a base64 data URL, validates
mime (png/jpg/webp/svg) + size (≤2 MB), writes to `apps/backend/uploads/tenant-logos`,
returns the public path. No multer, no cloud SDK (chosen because `npm install`
couldn't run). `InvalidLogoError extends BadRequestError` → 400.
S3 seam: replace the function body with an S3 PutObject; callers only need the
returned string.

### Static serving (`src/app.ts`)
`express.static` mounts `/uploads` with header
`Cross-Origin-Resource-Policy: cross-origin` so the frontend (:3000) can load
images from the backend (:4000) past helmet's default CORP.

### platform-admin module
- **repository**: `TENANT_SELECT` projection; paginated `listTenants({page,limit,search,status})`
  with case-insensitive OR search; `findTenantById`, `findTenantByEmail` (uniqueness),
  `createTenantWithOrganization(data)`, `updateTenant`, `setTenantStatus`;
  dashboard aggregates: `dashboardCounts`, `recentTenants`, `recentUsers`
  (User has NO `tenant` relation — resolve names via `tenantNameMap`),
  `usersGroupedByTenant`.
- **service**: `TenantView` widened with contact/email/phone/address/logoUrl/organizationCount;
  `createTenant`/`updateTenant` enforce slug + email uniqueness (`ConflictError`) and call
  `saveTenantLogo`; `getDashboardStats` → `PlatformDashboardStats`.
- **validation**: `createTenantSchema`/`updateTenantSchema` (optional profile fields + `logoBase64`),
  `listTenantsQuerySchema` (coerced page/limit, search, status).
- **routes** (all `authenticatePlatform`):
  `GET /dashboard`, `GET /tenants` (validated query), `POST /tenants`,
  `GET /tenants/:id`, `PUT /tenants/:id`, `PATCH /tenants/:id/status`.

### shared-types (`packages/shared-types/src/index.ts`)
`TenantDto` widened; added `CreateTenantInput` (with `logoBase64`),
`UpdateTenantInput`, `PlatformDashboardStats`.
**Field-name mapping:** UI/DTO use `companyName`/`companyUniqueCode`; backend
payload uses `name`/`companyCode`. The frontend api layer translates.

---

## 3. Frontend (apps/frontend)

- `src/lib/api/platform.ts` — data layer on `platformClient` (maps DTO→payload names).
- `src/hooks/queries/use-platform.ts` — TanStack hooks: `useDashboardStats`,
  `useTenants`, `useTenant`, `useCreateTenant`, `useUpdateTenant`, `useSetTenantStatus`.
- `src/lib/assets.ts` — `resolveAssetUrl` (strips `/api/v1` to build the uploads origin).
- `src/lib/file-to-data-url.ts` — `fileToDataUrl` + `validateLogoFile` (2 MB, mime).
- `src/components/shared/tenant-logo.tsx` — logo tile w/ initials fallback (listing/form/sidebar).
- `src/components/shared/stat-card.tsx` — KPI tile.
- `src/components/shared/mini-charts.tsx` — dependency-free `HorizontalBarChart` + `DonutChart`
  (no recharts — not installed; pure CSS/SVG).
- `src/app/super-admin/layout.tsx` — pathname-aware shell: login renders bare,
  everything else wrapped in `PlatformSessionProvider` + `PlatformSidebar`.
- `src/app/super-admin/platform-session.tsx` — guard (refresh→redirect) + `usePlatformSession`.
- `src/app/super-admin/platform-sidebar.tsx` — sidebar; Dashboard first, then
  Tenant Management; Subscriptions/Platform Settings shown disabled ("Soon").
- `src/app/super-admin/dashboard/page.tsx` — REWRITTEN: KPI cards, 2 charts,
  recent tenants, recent users, quick actions, responsive.
- `src/app/super-admin/tenants/page.tsx` — listing: debounced search, status filter,
  pagination, logo, status badge, Edit + Suspend/Activate. (`useSearchParams` in a Suspense boundary.)
- `src/app/super-admin/tenants/tenant-form-dialog.tsx` — create/edit dialog with
  logo upload (base64) + preview; email-unique + required validation.
- `src/app/super-admin/(console)/layout.tsx` — inert no-op (route-group leftover; harmless).

**No hard-delete:** backend exposes activate/suspend (status toggle), not tenant
deletion — the listing's destructive action is Suspend, which is SaaS-correct.

---

## 4. Not yet run (shell/VM was unavailable this whole session)
- prisma migrate dev + generate + seed (see commands above)
- `npm run typecheck` for backend + frontend
- No `npm install` was needed (zero new deps by design).

## 5. Login / seed credentials
- Super admin: `superadmin@liftsaas.example.com` / `Super@12345` → `/super-admin/login`
- Tenant admin (acme): `admin@liftsaas.example.com` / `Admin@12345`
- Tenant admin (otis): `admin@otis.example.com` / `Admin@12345`
