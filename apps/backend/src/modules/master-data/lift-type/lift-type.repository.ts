import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class LiftTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, listArgs: PrismaListArgs) {
    return this.prisma.liftType.findMany({ where: { tenantId: tenant.tenantId }, ...listArgs });
  }

  count(tenant: TenantContext) {
    return this.prisma.liftType.count({ where: { tenantId: tenant.tenantId } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.liftType.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }

  findByCode(tenant: TenantContext, code: string) {
    return this.prisma.liftType.findFirst({ where: { tenantId: tenant.tenantId, code } });
  }

  create(tenant: TenantContext, data: { code: string; name: string }) {
    return this.prisma.liftType.create({ data: { tenantId: tenant.tenantId, ...data } });
  }

  update(id: number, data: Partial<{ name: string; isActive: boolean }>) {
    return this.prisma.liftType.update({ where: { id }, data });
  }
}
