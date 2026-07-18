/* eslint-disable no-console */
// Optional, idempotent demo-data seed — separate from seed.ts (which owns
// roles/permissions/master-data/the bootstrap admin). Run this only when you
// want sample business data to click through the UI with. Safe to re-run;
// every insert checks for an existing row first instead of blindly creating.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TENANT_ID = 1;
const ORGANIZATION_ID = 1;
const DEMO_PASSWORD = 'Demo@12345';

async function findOrCreateUser(email: string, roleCode: string, firstName: string, lastName: string) {
  const existing = await prisma.user.findFirst({ where: { tenantId: TENANT_ID, email } });
  if (existing) return existing;

  const role = await prisma.role.findFirst({ where: { tenantId: TENANT_ID, code: roleCode } });
  if (!role) throw new Error(`Role "${roleCode}" not found — run "npm run prisma:seed" first.`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  return prisma.user.create({
    data: { tenantId: TENANT_ID, organizationId: ORGANIZATION_ID, roleId: role.id, email, passwordHash, firstName, lastName }
  });
}

async function findOrCreateCustomer(name: string, email: string, phone: string) {
  const existing = await prisma.customer.findFirst({ where: { tenantId: TENANT_ID, name } });
  if (existing) return existing;
  return prisma.customer.create({ data: { tenantId: TENANT_ID, organizationId: ORGANIZATION_ID, name, email, phone } });
}

async function findOrCreateSite(customerId: number, name: string, addressLine1: string, city: string, state: string, pincode: string) {
  const existing = await prisma.site.findFirst({ where: { tenantId: TENANT_ID, customerId, name } });
  if (existing) return existing;
  return prisma.site.create({
    data: { tenantId: TENANT_ID, organizationId: ORGANIZATION_ID, customerId, name, addressLine1, city, state, pincode }
  });
}

async function main() {
  console.log('🌱 Seeding demo business data...');

  const engineer = await findOrCreateUser('engineer@liftsaas.example.com', 'ENGINEER', 'Ravi', 'Sharma');
  const technician = await findOrCreateUser('technician@liftsaas.example.com', 'TECHNICIAN', 'Suresh', 'Kumar');
  const manager = await findOrCreateUser('manager@liftsaas.example.com', 'MANAGER', 'Priya', 'Verma');
  console.log(`  ✓ Demo users: ${engineer.email}, ${technician.email}, ${manager.email} (password: ${DEMO_PASSWORD})`);

  const customer1 = await findOrCreateCustomer('Skyline Towers Pvt Ltd', 'facilities@skylinetowers.example.com', '9876500001');
  const customer2 = await findOrCreateCustomer('Metro Mall Developers', 'ops@metromall.example.com', '9876500002');
  console.log(`  ✓ Customers: ${customer1.name}, ${customer2.name}`);

  const site1 = await findOrCreateSite(customer1.id, 'Skyline Towers - Tower A', '12 MG Road', 'Jaipur', 'Rajasthan', '302001');
  const site2 = await findOrCreateSite(customer1.id, 'Skyline Towers - Tower B', '14 MG Road', 'Jaipur', 'Rajasthan', '302001');
  const site3 = await findOrCreateSite(customer2.id, 'Metro Mall - Wing 1', '5 Station Road', 'Jaipur', 'Rajasthan', '302015');
  console.log(`  ✓ Sites: ${site1.name}, ${site2.name}, ${site3.name}`);

  // One pre-existing Lift so AMC contracts can be demoed immediately without
  // first running the full Installation → Complete workflow.
  const passengerType = await prisma.liftType.findFirst({ where: { tenantId: TENANT_ID, code: 'PASSENGER' } });
  const installedStatus = await prisma.status.findFirst({ where: { tenantId: TENANT_ID, entityType: 'LIFT', code: 'INSTALLED' } });

  if (!passengerType || !installedStatus) {
    throw new Error('Master data missing — run "npm run prisma:seed" first.');
  }

  const existingLift = await prisma.lift.findFirst({ where: { tenantId: TENANT_ID, serialNumber: 'DEMO-LIFT-0001' } });
  const lift =
    existingLift ??
    (await prisma.lift.create({
      data: {
        tenantId: TENANT_ID,
        organizationId: ORGANIZATION_ID,
        siteId: site1.id,
        liftTypeId: passengerType.id,
        statusId: installedStatus.id,
        serialNumber: 'DEMO-LIFT-0001',
        model: 'Schindler 3300',
        capacityKg: 680,
        numberOfFloors: 12,
        installationDate: new Date('2025-01-15')
      }
    }));
  console.log(`  ✓ Demo lift: ${lift.serialNumber} at ${site1.name}`);

  console.log('✅ Demo data seed complete.');
  console.log('   You can now populate Customer/Site/Lift dropdowns in the Installation and AMC forms.');
}

main()
  .catch((err) => {
    console.error('❌ Demo seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
