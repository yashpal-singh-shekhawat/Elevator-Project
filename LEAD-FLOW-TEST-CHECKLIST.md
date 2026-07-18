# Lead Flow — Testing Checklist

Test everything as an **ADMIN** user of a tenant. Only ADMIN has `lead.*`,
`quotation.*`, `survey.*` by default. Base API prefix: `/api/v1`.

---

## Phase 0 — Setup (tenant + admin)

- [ ] Super-admin se ek **naya tenant** create karo (contact/email/phone/logo optional).
      → Auto-seed hone se new tenant ke paas Roles, Permissions, aur
      Master-data (LEAD + QUOTATION statuses, lift types, service types) hone chahiye.
- [ ] Naye tenant ka **admin email + password** note karo.
- [ ] Browser me `localhost:3000/<slug>/login` kholo.
- [ ] **Branding check:** agar logo add kiya tha to login page pe logo + company
      name dikhe. Purana default text ("Lift Management SaaS") FLASH nahi hona chahiye.
- [ ] Admin credentials se login. Dashboard khule, sidebar me tenant ka
      logo/name dikhe (warna "Lift SaaS" fallback).

## Phase 1 — Master data verify (leads ke pehle)

- [ ] Sidebar → **Master Data**. `entityType = LEAD` statuses dikhne chahiye
      (NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST).
- [ ] `QUOTATION` statuses bhi maujood hon (quotation step ke liye zaroori).
- [ ] Lift Types aur Service Types populated hon.

## Phase 2 — Leads: list + create

- [ ] Sidebar → **Leads**. List page khule (pehle khaali ho sakta hai — ok).
- [ ] **"New Lead"** button → `/leads/new` form khule.
- [ ] Form me sab dropdowns bharte hon:
  - [ ] **Vertical** (INSTALLATION / AMC) — required
  - [ ] **Status** dropdown me LEAD statuses dikhein (khaali NAHI)
  - [ ] **Assign to** dropdown me sales reps/admin dikhein (khaali NAHI)
  - [ ] Customer / Site (optional), contact name/phone/email, notes
- [ ] Lead create karo (status + assign-to set karke). Success message aaye.
- [ ] `/leads/<id>` detail page pe redirect ho — **koi runtime error NAHI**
      (workflow-timeline crash fix ho chuka hai; timeline khaali ho to
      "No status changes recorded yet." dikhe).
- [ ] Leads list pe wapas jaakar naya lead row dikhe (listing table populate ho).

## Phase 3 — Assign lead

- [ ] Lead detail page pe **Assign** dialog kholo.
- [ ] Alag user select karke assign karo → success, assigned-to update ho jaye.
- [ ] (Do assignment paths hain: create ke time `assignedToId`, ya detail pe
      `POST /:id/assign`. Dono verify kar lo.)

## Phase 4 — Status transition

- [ ] Lead detail pe **Transition / Change Status** dialog kholo.
- [ ] Naya status (e.g. NEW → CONTACTED) + remarks daalke apply karo.
- [ ] Success ke baad **Workflow timeline** me entry dikhe (from → to,
      user naam, timestamp, remarks). Ab crash nahi hona chahiye.

## Phase 5 — Quotation (lead detail se)

- [ ] Lead detail pe **Create Quotation** dialog kholo.
- [ ] Fields: tier (BASIC/STANDARD/PREMIUM optional), QUOTATION status
      (required — dropdown khaali NAHI), validUntil, totalAmount, notes.
- [ ] Create karo → quotation row lead detail pe dikhe.
- [ ] Quotation pe actions test karo:
  - [ ] **Approve** (`quotation.approve`)
  - [ ] **Reject** (`quotation.approve`)
  - [ ] **Revise** (`quotation.create`)
- [ ] Har action ke baad quotation status update ho.

## Phase 6 — Delete (cleanup / permission check)

- [ ] Lead **delete** karke dekho (`lead.manage`). Admin ke paas hona chahiye.
- [ ] Delete ke baad list se lead hat jaye.

## Phase 7 — Negative / permission checks (optional but recommended)

- [ ] Ek **non-admin** user (e.g. sirf SALES role) banao aur login karo.
- [ ] Confirm: use lead create/quotation pe **403** aaye ya nav hidden ho —
      kyunki default non-admin roles ke paas `lead.*`/`quotation.*` nahi hote.
- [ ] (Agar sales ko access chahiye → Roles & Permissions screen se custom role
      me `lead.*` / `quotation.*` add karke re-login karke test karo.)

---

## Backend route reference (for debugging in Network tab)

| Step        | Method + Path                          | Permission        |
|-------------|----------------------------------------|-------------------|
| List leads  | `GET /leads`                           | `lead.view`       |
| Lead detail | `GET /leads/:id`                       | `lead.view`       |
| Create lead | `POST /leads`                          | `lead.create`     |
| Update lead | `PATCH /leads/:id`                     | `lead.update`     |
| Assign lead | `POST /leads/:id/assign`               | `lead.assign`     |
| Transition  | `POST /leads/:id/transition`           | `lead.update`     |
| Delete lead | `DELETE /leads/:id`                    | `lead.manage`     |
| Statuses    | `GET /master-data/statuses?entityType=LEAD` | `masterdata.view` |
| Quotation create | `POST /quotations`                | `quotation.create`|
| Quotation approve/reject | `POST /quotations/:id/approve` `/reject` | `quotation.approve` |
| Timeline    | `GET /workflow-transitions?entityType=LEAD&entityId=:id` | `workflow.transition` |

**Tip:** koi cheez khaali/error dikhe to browser **DevTools → Network** kholo,
uss request ka **Preview** dekho. `success:true` + empty `data:[]` = data hi
nahi hai (seed issue). `403` = permission missing (non-admin se test kar rahe ho).
