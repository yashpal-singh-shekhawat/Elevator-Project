/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_TENANT_ROLES } from '../common/rbac/default-roles';
import {
  DEFAULT_STATUSES,
  DEFAULT_LIFT_TYPES,
  DEFAULT_SERVICE_TYPES
} from '../common/rbac/default-master-data';

const prisma = new PrismaClient();

const TENANT_ID = 1;
const ORGANIZATION_ID = 1;

// ---------------------------------------------------------------------------
// Static role/permission matrix for Phase 1. In Phase 2 this becomes editable
// via an admin UI; for now it is the single source of truth for seeding.
// ---------------------------------------------------------------------------

const PERMISSIONS = [
  // Users / Admin
  { code: 'users.manage', module: 'users', description: 'Create, update, deactivate users' },

  // Master Data
  { code: 'masterdata.view', module: 'master-data', description: 'View statuses, lift types, service types' },
  { code: 'masterdata.manage', module: 'master-data', description: 'Manage statuses, lift types, service types' },

  // Customers / Sites / Lifts
  { code: 'customer.view', module: 'customer', description: 'View customers and sites' },
  { code: 'customer.manage', module: 'customer', description: 'Create/update customers and sites' },
  { code: 'lift.view', module: 'lift', description: 'View lift records' },
  { code: 'lift.manage', module: 'lift', description: 'Create/update lift records' },

  // Leads — `lead.view` scopes a user to only their assigned leads;
  // `lead.view.all` widens that to every lead in the tenant.
  { code: 'lead.view', module: 'lead', description: 'View leads assigned to you' },
  { code: 'lead.view.all', module: 'lead', description: 'View ALL tenant leads (not just your assigned ones)' },
  { code: 'lead.create', module: 'lead', description: 'Create leads' },
  { code: 'lead.update', module: 'lead', description: 'Update leads' },
  { code: 'lead.assign', module: 'lead', description: 'Assign leads to users' },
  { code: 'lead.manage', module: 'lead', description: 'Full lead management' },

  // Installation
  { code: 'installation.view', module: 'installation', description: 'View installation projects' },
  { code: 'installation.create', module: 'installation', description: 'Create installation projects' },
  { code: 'installation.update', module: 'installation', description: 'Update installation projects/tasks' },
  { code: 'installation.assign', module: 'installation', description: 'Assign engineers/technicians to tasks' },
  { code: 'installation.signoff', module: 'installation', description: 'Sign off installation milestones' },

  // AMC
  { code: 'amc.view', module: 'amc', description: 'View AMC contracts and visits' },
  { code: 'amc.create', module: 'amc', description: 'Create AMC contracts' },
  { code: 'amc.update', module: 'amc', description: 'Update AMC contracts/schedules' },
  { code: 'amc.assign', module: 'amc', description: 'Assign technicians to visits' },
  { code: 'amc.visit.log', module: 'amc', description: 'Log AMC visit findings/actions' }
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: PERMISSIONS.map((p) => p.code), // Admin gets everything
  MANAGER: [
    'masterdata.view',
    'customer.view',
    'customer.manage',
    'lift.view',
    'lift.manage',
    'installation.view',
    'installation.create',
    'installation.update',
    'installation.assign',
    'installation.signoff',
    'amc.view',
    'amc.create',
    'amc.update',
    'amc.assign'
  ],
  ENGINEER: [
    'masterdata.view',
    'customer.view',
    'lift.view',
    'installation.view',
    'installation.update',
    'installation.signoff'
  ],
  TECHNICIAN: ['masterdata.view', 'lift.view', 'installation.view', 'amc.view', 'amc.visit.log']
};

const ROLE_DEFS = [
  { code: 'ADMIN', name: 'Admin' },
  { code: 'MANAGER', name: 'Manager' },
  { code: 'ENGINEER', name: 'Engineer' },
  { code: 'TECHNICIAN', name: 'Technician' }
];

async function main() {
  console.log('🌱 Seeding Lift SaaS Phase 1 data...');

  // --- Tenant / Organization -------------------------------------------------
  // Primary demo tenant. `slug` IS the company_unique_code used in URLs
  // (/acme/login, /acme/dashboard, x-tenant-code: acme).
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {
      name: 'Acme Elevators',
      slug: 'acme',
      contactPerson: 'Rajesh Kumar',
      email: 'contact@acme-elevators.example.com',
      phone: '+91 98200 11111',
      address: 'Plot 14, MIDC Industrial Area, Pune, MH 411019'
    },
    create: {
      id: TENANT_ID,
      name: 'Acme Elevators',
      slug: 'acme',
      contactPerson: 'Rajesh Kumar',
      email: 'contact@acme-elevators.example.com',
      phone: '+91 98200 11111',
      address: 'Plot 14, MIDC Industrial Area, Pune, MH 411019'
    }
  });

  await prisma.organization.upsert({
    where: { id: ORGANIZATION_ID },
    update: {},
    create: { id: ORGANIZATION_ID, tenantId: TENANT_ID, name: 'Acme Elevators HQ' }
  });
  console.log('  ✓ Tenant + Organization');

  // --- Permissions -------------------------------------------------------------
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, description: perm.description },
      create: perm
    });
  }
  console.log(`  ✓ ${PERMISSIONS.length} permissions`);

  // --- Roles + RolePermission mapping -------------------------------------------
  const roleIdByCode: Record<string, number> = {};
  for (const roleDef of ROLE_DEFS) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: roleDef.code } },
      update: { name: roleDef.name },
      create: { tenantId: TENANT_ID, code: roleDef.code, name: roleDef.name }
    });
    roleIdByCode[roleDef.code] = role.id;
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleIdByCode[roleCode];
    for (const permCode of permCodes) {
      const permissionId = permissionIdByCode.get(permCode);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId }
      });
    }
  }
  console.log('  ✓ Roles + role-permission matrix');

  // --- Default ForceLift role catalogue (per-tenant, editable) ---------------
  // Pre-seed the extended role hierarchy so the demo tenant matches what every
  // newly-provisioned tenant receives. Codes not in the permission list skip.
  for (const roleDef of DEFAULT_TENANT_ROLES) {
    const role = await prisma.role.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: roleDef.code } },
      update: { name: roleDef.name, description: roleDef.description },
      create: { tenantId: TENANT_ID, code: roleDef.code, name: roleDef.name, description: roleDef.description }
    });
    for (const permCode of roleDef.permissionCodes) {
      const permissionId = permissionIdByCode.get(permCode);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId }
      });
    }
  }
  console.log(`  ✓ ${DEFAULT_TENANT_ROLES.length} default ForceLift roles`);

  // --- Master Data: Statuses ------------------------------------------------
  for (const status of DEFAULT_STATUSES) {
    await prisma.status.upsert({
      where: {
        tenantId_entityType_code: { tenantId: TENANT_ID, entityType: status.entityType, code: status.code }
      },
      update: { label: status.label, color: status.color, sortOrder: status.sortOrder },
      create: { tenantId: TENANT_ID, ...status }
    });
  }
  console.log(`  ✓ ${DEFAULT_STATUSES.length} status rows across all entity types`);

  // --- Master Data: Lift Types -----------------------------------------------
  for (const lt of DEFAULT_LIFT_TYPES) {
    await prisma.liftType.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: lt.code } },
      update: { name: lt.name },
      create: { tenantId: TENANT_ID, ...lt }
    });
  }
  console.log(`  ✓ ${DEFAULT_LIFT_TYPES.length} lift types`);

  // --- Master Data: Service Types ---------------------------------------------
  for (const st of DEFAULT_SERVICE_TYPES) {
    await prisma.serviceType.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: st.code } },
      update: { name: st.name },
      create: { tenantId: TENANT_ID, ...st }
    });
  }
  console.log(`  ✓ ${DEFAULT_SERVICE_TYPES.length} service types`);

  // --- Bootstrap Admin User ---------------------------------------------------
  const adminEmail = 'admin@liftsaas.example.com';
  const tempPassword = 'Admin@12345'; // CHANGE IMMEDIATELY after first login
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: TENANT_ID, email: adminEmail } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      organizationId: ORGANIZATION_ID,
      roleId: roleIdByCode.ADMIN,
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Admin'
    }
  });
  console.log(`  ✓ Bootstrap admin user (${adminEmail} / ${tempPassword} — change immediately)`);

  // --- Platform (super-admin) user -------------------------------------------
  // Completely separate identity space from tenant users. Lives in
  // platform_users, authenticates at /super-admin/login → /api/v1/platform-admin/auth/login.
  const platformEmail = 'superadmin@liftsaas.example.com';
  const platformPassword = 'Super@12345'; // CHANGE IMMEDIATELY after first login
  const platformHash = await bcrypt.hash(platformPassword, 10);

  await prisma.platformUser.upsert({
    where: { email: platformEmail },
    update: {},
    create: {
      email: platformEmail,
      passwordHash: platformHash,
      firstName: 'Platform',
      lastName: 'Owner'
    }
  });
  console.log(`  ✓ Platform super-admin (${platformEmail} / ${platformPassword} — change immediately)`);

  // --- Second tenant (cross-tenant isolation demo) ---------------------------
  // Lets you verify that an Acme user CANNOT log in at /otis/login and that a
  // JWT minted for Acme is rejected (403) on /otis/* routes.
  const SECOND_TENANT_ID = 2;
  const SECOND_ORG_ID = 2;

  await prisma.tenant.upsert({
    where: { id: SECOND_TENANT_ID },
    update: {
      name: 'Otis Lifts',
      slug: 'otis',
      contactPerson: 'Farhan Ali',
      email: 'contact@otis-lifts.example.com',
      phone: '+91 98765 22222',
      address: '2nd Floor, Prestige Tower, Bengaluru, KA 560001'
    },
    create: {
      id: SECOND_TENANT_ID,
      name: 'Otis Lifts',
      slug: 'otis',
      contactPerson: 'Farhan Ali',
      email: 'contact@otis-lifts.example.com',
      phone: '+91 98765 22222',
      address: '2nd Floor, Prestige Tower, Bengaluru, KA 560001'
    }
  });
  await prisma.organization.upsert({
    where: { id: SECOND_ORG_ID },
    update: {},
    create: { id: SECOND_ORG_ID, tenantId: SECOND_TENANT_ID, name: 'Otis Lifts HQ' }
  });

  // Second tenant needs its own ADMIN role (roles are per-tenant).
  const otisAdminRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: SECOND_TENANT_ID, code: 'ADMIN' } },
    update: { name: 'Admin' },
    create: { tenantId: SECOND_TENANT_ID, code: 'ADMIN', name: 'Admin' }
  });
  for (const permCode of ROLE_PERMISSIONS.ADMIN) {
    const permissionId = permissionIdByCode.get(permCode);
    if (!permissionId) continue;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: otisAdminRole.id, permissionId } },
      update: {},
      create: { roleId: otisAdminRole.id, permissionId }
    });
  }

  const otisAdminEmail = 'admin@otis.example.com';
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: SECOND_TENANT_ID, email: otisAdminEmail } },
    update: {},
    create: {
      tenantId: SECOND_TENANT_ID,
      organizationId: SECOND_ORG_ID,
      roleId: otisAdminRole.id,
      email: otisAdminEmail,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      firstName: 'Otis',
      lastName: 'Admin'
    }
  });
  console.log(`  ✓ Second tenant "otis" + admin (${otisAdminEmail} / ${tempPassword})`);

  console.log('✅ Seed complete.');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
