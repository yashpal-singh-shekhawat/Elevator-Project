# ForceLift — Tenant & RBAC Flow: Use Cases + Checklist

Ye document poore multi-tenant RBAC flow ko cover karta hai — **Super Admin ke tenant banane se lekar Tenant Admin ke users, roles aur permissions manage karne tak**. Har section mein: kya hota hai (explanation), kaun karta hai (actor), aur ek tick-karne-layak checklist hai.

> **3 layers yaad rakho (poore doc ki base):**
> 1. **Permissions** = platform-fixed master list (code ke saath bandhi, tenant naya nahi bana sakta). ~17 codes.
> 2. **Roles + Role→Permission mapping** = per-tenant, fully dynamic (tenant admin edit karta hai).
> 3. **Users → Role** = per-tenant, dynamic (tenant admin assign karta hai).
>
> **Permission change ka timing:** Token snapshot model. Kisi role ki permission badalne ka asar us role ke user par **agle login** pe aata hai (live per-request nahi). Ye jaan-boojhkar simple rakha gaya hai.

---

## Actors (kaun-kaun hai)

| Actor | Login URL | Identity space | Kaam |
|-------|-----------|----------------|------|
| **Super Admin (Platform)** | `/super-admin/login` | `platform_users` (alag) | Tenants create/manage karta hai |
| **Tenant Admin** | `/{slug}/login` (e.g. `/acme/login`) | `users` (tenant-scoped) | Apne tenant ke users + roles + permissions manage karta hai |
| **Tenant User** | `/{slug}/login` | `users` (tenant-scoped) | Apne role ke permissions ke hisaab se kaam karta hai |

---

## Pre-conditions (shuru karne se pehle)

Ye ek baar setup karna hai. Detail commands `docs/super-admin-test-checklist.md` mein bhi hain.

- [ ] `cd apps\backend` karke `npm run prisma:generate` chala — Prisma client ready
- [ ] `npm run prisma:migrate` (ya `npx prisma db push`) — DB schema apply
- [ ] `npm run prisma:seed` — permissions, default roles, demo tenants, platform admin seed ho gaye
- [ ] Backend chal raha: `npm run dev -w @lift-saas/backend` (port 4000)
- [ ] Frontend chal raha: `npm run dev -w @lift-saas/frontend` (port 3000)
- [ ] Seed console se creds note kiye:
  - Platform: `superadmin@liftsaas.example.com` / `Super@12345`
  - Tenant demo: `admin@liftsaas.example.com` / `Admin@12345` (Acme)

---

# USE CASE 1 — Super Admin ek naya Tenant banata hai

**Actor:** Super Admin
**Screen:** `/super-admin/tenants`
**Kya hota hai (explanation):** Jab Super Admin "Create Tenant" karta hai, backend ek hi transaction mein: (a) tenant + default organization banata hai, (b) **ADMIN role** banata hai jise **saari permissions** milti hain, (c) **18 default ForceLift roles** (Sales Manager, Service Engineer, HR Manager, etc.) starter permissions ke saath pre-seed karta hai, aur (d) ek **admin user** banata hai jiska temp password generate hota hai. Response mein first-login creds ek baar dikhte hain.

### Steps
1. `/super-admin/login` pe platform creds se login karo.
2. Sidebar → **Tenants** → **Create Tenant** button.
3. Form bharo:
   - Company name (e.g. `Kone Elevators`)
   - Company code / slug (e.g. `kone`) — **URL mein use hoga, baad mein change nahi hota**
   - Contact person, email, phone, address (optional)
   - Logo upload (optional) — preview turant dikhega
4. **Create tenant** dabao.
5. Success panel khulega jisme: **Login URL** (`/kone/login`), **Admin email**, **Temp password**. Copy button se copy karo.
6. **Done** dabao.

### Checklist
- [ ] Naya tenant list mein dikh raha hai
- [ ] Success panel mein Login URL, admin email, temp password aaye
- [ ] Duplicate slug/email daalne pe proper error aata hai (uniqueness)
- [ ] Logo upload kiya to list/preview mein dikh raha hai
- [ ] Copy buttons kaam kar rahe hain

### Explanation — kya andar bana
- ADMIN role → **sabhi permissions** (locked, delete nahi hoga)
- 18 default roles → apne-apne starter permission set ke saath, **editable**
- 1 admin user → temp password ke saath, `/{slug}/login` pe login-ready

---

# USE CASE 2 — Naya Tenant Admin pehli baar login karta hai

**Actor:** Tenant Admin
**Screen:** `/{slug}/login`
**Kya hota hai:** Admin user ke pass ADMIN role hai → saari permissions → login ke time ye permissions **token snapshot** mein embed ho jaati hain. Is liye admin ko sidebar mein saare tabs dikhte hain (Users aur Roles & Permissions samet).

### Steps
1. Success panel wale **Login URL** pe jao (e.g. `/kone/login`).
2. Admin email + temp password daalo → login.
3. Dashboard khulega — permission-adaptive shortcuts dikhenge.

### Checklist
- [ ] Sahi slug URL pe login hua
- [ ] Sidebar mein **Users** aur **Roles & Permissions** tabs dikh rahe hain
- [ ] Dashboard pe role naam (`Admin`) dikh raha hai
- [ ] Galat slug (`/otis/login`) pe wahi creds kaam **nahi** karte (cross-tenant isolation)

---

# USE CASE 3 — Tenant Admin ek Role ki Permissions set/edit karta hai

**Actor:** Tenant Admin
**Screen:** `/{slug}/roles` (sidebar → Roles & Permissions)
**Kya hota hai:** Ye feature ka dil hai — **checkbox matrix**. Left panel mein tenant ke saare roles; right panel mein module-wise grouped permissions checkboxes ke saath. Save karne par backend us role ki RolePermission rows ko exactly nayi list se replace kar deta hai.

### Steps
1. Sidebar → **Roles & Permissions**.
2. Left list se koi role chuno (e.g. `Service Engineer`).
3. Right side module sections (AMC, Installation, Customer, etc.) mein checkboxes toggle karo.
   - Poora module ek saath dene/hatane ke liye **"Select all"** use karo.
4. **Save changes** dabao (button tab hi enable hota hai jab kuch badla ho).

### Checklist
- [ ] Role select karne pe uske current permissions pre-checked dikhte hain
- [ ] Checkbox toggle karne pe **Save changes** enable ho jaata hai
- [ ] "Select all" poore module ko toggle karta hai
- [ ] Kuch checkboxes pe module header **indeterminate** (dash) dikhata hai
- [ ] Save ke baad "Permissions saved" toast aata hai
- [ ] Bina save kiye dusra role/route pe jaate waqt **"Discard unsaved changes?"** warning aati hai
- [ ] **ADMIN role locked hai** — sab checked, edit/delete disabled, "System" badge dikhta hai

### Explanation — important
Ye change **turant live nahi hota** us role ke already-logged-in users par. Asar **agle login** pe aata hai (token snapshot). Ye verify Use Case 6 mein.

---

# USE CASE 4 — Tenant Admin ek naya custom Role banata hai

**Actor:** Tenant Admin
**Screen:** `/{slug}/roles` → **New Role**
**Kya hota hai:** 18 default roles ke alawa tenant apna custom role bana sakta hai (e.g. `Regional Supervisor`). Naya role blank permissions ke saath banta hai; phir matrix se permissions do.

### Steps
1. Roles & Permissions screen → **New Role**.
2. **Role name** likho (e.g. `Regional Supervisor`) — code (`REGIONAL_SUPERVISOR`) auto-suggest hoga.
3. Optional description.
4. **Create role** → naya role automatically select ho jaata hai.
5. Ab matrix se permissions choose karke **Save changes**.

### Checklist
- [ ] Naam type karte hi code UPPER_SNAKE_CASE mein auto-ban raha hai
- [ ] Duplicate code pe error aata hai
- [ ] Create ke baad role left list mein aa gaya aur select ho gaya
- [ ] Matrix se permissions de kar save ho jaati hain
- [ ] `0 users` count dikh raha hai (abhi kisi ko assign nahi kiya)

---

# USE CASE 5 — Tenant Admin ek User banata hai aur Role assign karta hai

**Actor:** Tenant Admin
**Screen:** `/{slug}/users` (sidebar → Users)
**Kya hota hai:** Admin team member ka login banata hai, use koi role deta hai. Temp password generate hota hai jo admin user ko share karta hai.

### Steps
1. Sidebar → **Users** → **Add User**.
2. First name, last name, email daalo.
3. **Role** dropdown se role chuno (yahan wahi 18 + custom roles aayenge).
4. Temp password auto-generate hoga — **copy** karke user ko do (ya apna set karo).
5. **Create user**.

### Checklist
- [ ] Role dropdown mein saare tenant roles dikh rahe hain
- [ ] Temp password generate + copy ho raha hai
- [ ] Duplicate email pe "already exists" error
- [ ] Naya user list mein role badge + "Active" status ke saath dikh raha hai
- [ ] **Edit** se naam/role/phone badal sakte hain aur active/inactive toggle kar sakte hain
- [ ] **Remove** (soft delete) confirm ke baad user hata deta hai

---

# USE CASE 6 — Naya User apne role ke hisaab se dashboard dekhta hai (permission-driven)

**Actor:** Tenant User
**Screen:** `/{slug}/login` → dashboard + sidebar
**Kya hota hai:** User login karta hai → uske role ki permissions token mein aa jaati hain → sidebar aur dashboard **sirf wahi sections** dikhate hain jinke liye uske pass permission hai. Ye adaptive hai (role-hardcoded nahi), is liye custom roles pe bhi kaam karta hai.

### Steps
1. Use Case 5 wale user ke temp creds se `/{slug}/login` pe login.
2. Dekho sidebar aur dashboard.

### Checklist
- [ ] User ko sirf uske permitted tabs dikhte hain (e.g. Service Engineer ko AMC/Service dikhe, Users/Roles **nahi**)
- [ ] Dashboard shortcuts bhi permission ke hisaab se adaptive hain
- [ ] Jis tab ka permission nahi, uska URL manually kholne pe bhi kaam ka data/actions nahi milte (backend `requirePermissions` block karta hai — 403)

### Explanation — timing verify karo
1. Admin us user ke role mein ek nayi permission add karke save karta hai.
2. User **abhi bhi logged-in hai** → naya tab turant **nahi** dikhta.
3. User **logout → dobara login** karta hai → ab naya tab/permission dikhta hai. ✅ (token snapshot confirm)

---

# USE CASE 7 — Role delete karne ke rules

**Actor:** Tenant Admin
**Screen:** `/{slug}/roles`
**Kya hota hai:** Role tab hi delete hota hai jab uspe koi user assigned na ho, aur ADMIN role kabhi delete nahi hota.

### Checklist
- [ ] ADMIN role pe **Delete** button hai hi nahi (protected)
- [ ] Jis role pe users hain, delete karne pe error: "Reassign the users on this role before deleting it"
- [ ] Users hata/reassign karne ke baad role delete ho jaata hai

---

# End-to-End Master Checklist (quick smoke test, ~15 min)

Ek hi baar top-to-bottom:

- [ ] **1.** Super admin login (`/super-admin/login`)
- [ ] **2.** Naya tenant banaya (slug `demo1`), success panel se creds copy kiye
- [ ] **3.** `/demo1/login` pe tenant admin login hua
- [ ] **4.** Sidebar mein Users + Roles & Permissions tabs dikhe
- [ ] **5.** Roles screen: `Service Engineer` role ki permissions edit + save ki
- [ ] **6.** Naya custom role `Regional Supervisor` banaya + permissions di
- [ ] **7.** Users screen: naya user banaya, `Service Engineer` role diya, temp password copy kiya
- [ ] **8.** Naye user se `/demo1/login` login — sirf permitted tabs dikhe
- [ ] **9.** Admin ne us role mein permission add ki → user relogin ke baad naya access mila
- [ ] **10.** Users wale role ko delete karne pe block hua; ADMIN role delete-proof mila
- [ ] **11.** Cross-tenant check: `demo1` creds `/acme/login` pe fail hue

---

# Behind-the-scenes reference (developer ke liye)

| Cheez | Kahan | Note |
|------|-------|------|
| Permissions master list | `apps/backend/src/prisma/seed.ts` → `PERMISSIONS` | ~17 codes, platform-fixed |
| Default 18 roles | `apps/backend/src/common/rbac/default-roles.ts` | ADMIN alag (full+locked) + 17 catalogue roles |
| Naye tenant pe provisioning | `platform-admin.repository.ts` → `createTenantWithAdmin` | tenant+org+ADMIN+18 roles+admin user, ek transaction |
| Roles API | `apps/backend/src/modules/roles/` | GET/POST/PATCH/DELETE + `PUT /roles/:id/permissions` |
| Permission gate (backend) | `requirePermissions(['users.manage'])` | Users + Roles routes isse guarded |
| Permission snapshot | `auth.service.ts` | Login pe `role.rolePermissions` → token `permissions[]` |
| Permission gate (frontend) | `components/shared/can.tsx` + `hooks/use-permissions.ts` | `<Can permission=...>` + adaptive sidebar |
| Users screen | `app/(dashboard)/users/` | list + create/edit dialog |
| Roles screen | `app/(dashboard)/roles/` | 2-panel checkbox matrix |

> **Golden rule:** Permission change ka asar **next login** pe. Testing karte waqt hamesha relogin karke verify karo.
