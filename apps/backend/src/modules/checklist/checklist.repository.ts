import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class ChecklistRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, entityType: string, entityId: number, listArgs: PrismaListArgs) {
    return this.prisma.checklistItem.findMany({
      where: { tenantId: tenant.tenantId, entityType, entityId },
      ...listArgs
    });
  }

  count(tenant: TenantContext, entityType: string, entityId: number) {
    return this.prisma.checklistItem.count({ where: { tenantId: tenant.tenantId, entityType, entityId } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.checklistItem.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }

  create(tenant: TenantContext, data: { entityType: string; entityId: number; label: string; sortOrder: number }) {
    return this.prisma.checklistItem.create({ data: { ...data, tenantId: tenant.tenantId } });
  }

  update(id: number, data: Prisma.ChecklistItemUpdateInput) {
    return this.prisma.checklistItem.update({ where: { id }, data });
  }

  delete(id: number) {
    return this.prisma.checklistItem.delete({ where: { id } });
  }
}
