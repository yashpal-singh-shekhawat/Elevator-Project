/**
 * READ-ONLY diagnostic. Does NOT modify anything.
 * Run: cd apps/backend && npx ts-node -r tsconfig-paths/register src/prisma/check-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Inspecting database (read-only)...\n');

  const [tenants, users, roles, permissions, customers, sites, lifts, leads] = await Promise.all([
    prisma.tenant.findMany({ select: { id: true, slug: true, name: true } }),
    prisma.user.count(),
    prisma.role.count(),
    prisma.permission.count(),
    prisma.customer.count(),
    prisma.site.count(),
    prisma.lift.count(),
    prisma.lead.count(),
  ]);

  console.log('🏢 Tenants:');
  if (tenants.length === 0) console.log('   (none)');
  for (const t of tenants) console.log(`   • id=${t.id}  slug=${t.slug}  name=${t.name}`);

  console.log('\n📊 Row counts (all tenants):');
  console.log(`   Users        : ${users}`);
  console.log(`   Roles        : ${roles}`);
  console.log(`   Permissions  : ${permissions}`);
  console.log(`   Customers    : ${customers}`);
  console.log(`   Sites        : ${sites}`);
  console.log(`   Lifts        : ${lifts}`);
  console.log(`   Leads        : ${leads}`);

  // Also check if lead.view.all landed
  const newPerm = await prisma.permission.findUnique({ where: { code: 'lead.view.all' } });
  console.log(`\n🔑 lead.view.all permission present: ${newPerm ? 'YES' : 'NO'}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
