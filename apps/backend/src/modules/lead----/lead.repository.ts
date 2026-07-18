import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class LeadRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      customer: { select: { id: true, name: true } },
      site: { select: { id: true, name: true } },
      status: { select: { id: true, code: true, label: true, color: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.LeadWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.lead.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.LeadWhereInput) {
    return this.prisma.lead.count({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
    });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.lead.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: Prisma.LeadUncheckedCreateInput) {
    return this.prisma.lead.create({
      data: {
        ...data,
        tenantId: tenant.tenantId,
        organizationId: tenant.organizationId,
        leadCode: `LEAD-${Date.now()}`,
      },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({ where: { id }, data, include: this.include });
  }

  softDelete(id: number) {
    return this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
