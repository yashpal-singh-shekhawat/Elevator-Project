import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class SiteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.SiteWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.site.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: { customer: { select: { id: true, name: true } } },
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.SiteWhereInput) {
    return this.prisma.site.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.site.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: { customer: { select: { id: true, name: true } } }
    });
  }

  create(
    tenant: TenantContext,
    data: {
      customerId: number;
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      latitude?: number;
      longitude?: number;
    }
  ) {
    return this.prisma.site.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId }
    });
  }

  update(id: number, data: Prisma.SiteUpdateInput) {
    return this.prisma.site.update({ where: { id }, data });
  }

  softDelete(id: number) {
    return this.prisma.site.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
