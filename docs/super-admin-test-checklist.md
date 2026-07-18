# Super Admin Module — Manual Test Checklist

Tick `[x]` jo pass ho. Fail ho to us line ke saamne **console error + network tab ka failed request** likh do.

Login: `superadmin@liftsaas.example.com` / `Super@12345` → `/super-admin/login`

---

## Step 0 — Build & Migrate (pehle ye)
- [ ] `npm run prisma:migrate  --workspace=@lift-saas/backend` — bina error
- [ ] `npm run prisma:generate --workspace=@lift-saas/backend`
- [ ] `npm run prisma:seed     --workspace=@lift-saas/backend`  ← script `prisma:seed` hai, `seed` nahi
- [ ] `npm run typecheck --workspace=@lift-saas/backend` — **platform-admin ka error nahi aana chahiye** (baaki purane module errors ignore)
- [ ] Backend `npm run dev` + Frontend `npm run dev --workspace=@lift-saas/frontend` dono chalu

---

## Step 1 — Login
- [ ] Sahi password → Dashboard pe redirect
- [ ] Galat password → error toast, redirect nahi

---

## Step 2 — Dashboard
- [ ] 4 KPI cards number dikha rahe (Total/Active Tenants, Total/Active Users)
- [ ] Bar chart (Users by Tenant) render — blank/crash nahi
- [ ] Donut chart (Tenant status) render
- [ ] Recent Tenants list (logo + naam)
- [ ] Recent Users list (initials + role/tenant)
- [ ] Quick Actions buttons kaam kar rahe
- [ ] Mobile/chhoti width pe layout tootta nahi (responsive)

---

## Step 3 — Tenant Listing (`/super-admin/tenants`)
- [ ] Seed tenants (acme, otis) dikhein
- [ ] Search "acme" → ~300ms baad filter
- [ ] Status filter Active/Inactive → list badle
- [ ] Pagination (agar 10+ tenants) — Next/Prev

---

## Step 4 — Create Tenant ⭐ (sabse important)
- [ ] Blank submit → required errors (Company name, Company code)
- [ ] Galat code (space/special char) → validation error
- [ ] Logo upload PNG → preview turant dikhe
- [ ] Logo 2MB se bada → error message ("max 2 MB")
- [ ] Sahi data + submit → success toast + list me naya tenant + logo
- [ ] **Duplicate email** (dusra tenant same email) → **409 error toast** (email already exists)
- [ ] **Duplicate company code** (jaise `acme`) → conflict error

---

## Step 5 — Edit + Status Toggle
- [ ] Edit → contact/phone/address update → save → list me reflect
- [ ] Edit me logo change → naya logo dikhe
- [ ] Suspend → status badge red "INACTIVE"
- [ ] Activate → wapas green "ACTIVE"

---

## Step 6 — Logo Persist ⭐
- [ ] Page **refresh** ke baad bhi uploaded logo dikhe (file `/uploads/tenant-logos` me save + serve ho rahi)
- [ ] Listing + dashboard + form preview sab me logo consistent

---

## Notes / Failures (yahan likho)
-
-
-
