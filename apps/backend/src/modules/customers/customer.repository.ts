import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class CustomerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.CustomerWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.customer.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.CustomerWhereInput) {
    return this.prisma.customer.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.customer.findFirst({ where: { id, tenantId: tenant.tenantId, deletedAt: null } });
  }

  create(tenant: TenantContext, data: { name: string; email?: string; phone?: string; gstNumber?: string; billingAddress?: string }) {
    return this.prisma.customer.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId }
    });
  }

  update(id: number, data: Prisma.CustomerUpdateInput) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  softDelete(id: number) {
    return this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
