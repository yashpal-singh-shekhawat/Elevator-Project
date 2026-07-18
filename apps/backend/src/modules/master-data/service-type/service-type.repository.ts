import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class ServiceTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, listArgs: PrismaListArgs) {
    return this.prisma.serviceType.findMany({ where: { tenantId: tenant.tenantId }, ...listArgs });
  }

  count(tenant: TenantContext) {
    return this.prisma.serviceType.count({ where: { tenantId: tenant.tenantId } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.serviceType.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }

  findByCode(tenant: TenantContext, code: string) {
    return this.prisma.serviceType.findFirst({ where: { tenantId: tenant.tenantId, code } });
  }

  create(tenant: TenantContext, data: { code: string; name: string }) {
    return this.prisma.serviceType.create({ data: { tenantId: tenant.tenantId, ...data } });
  }

  update(id: number, data: Partial<{ name: string; isActive: boolean }>) {
    return this.prisma.serviceType.update({ where: { id }, data });
  }
}
