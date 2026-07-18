import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class StatusRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, entityType: string | undefined, listArgs: PrismaListArgs) {
    return this.prisma.status.findMany({
      where: { tenantId: tenant.tenantId, ...(entityType ? { entityType } : {}) },
      ...listArgs
    });
  }

  count(tenant: TenantContext, entityType: string | undefined) {
    return this.prisma.status.count({
      where: { tenantId: tenant.tenantId, ...(entityType ? { entityType } : {}) }
    });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.status.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }

  /**
   * Used by other modules (Lift, Installation, AMC) to validate that a
   * statusId submitted by a client is both real AND tagged for the right
   * workflow entityType — prevents e.g. assigning an AMC_VISIT status to a
   * Lift record.
   */
  findActiveByEntityTypeAndId(tenant: TenantContext, entityType: string, id: number) {
    return this.prisma.status.findFirst({
      where: { id, tenantId: tenant.tenantId, entityType, isActive: true }
    });
  }

  findByTenantEntityTypeAndCode(tenant: TenantContext, entityType: string, code: string) {
    return this.prisma.status.findFirst({
      where: { tenantId: tenant.tenantId, entityType, code }
    });
  }

  create(tenant: TenantContext, data: { entityType: string; code: string; label: string; color?: string; sortOrder: number }) {
    return this.prisma.status.create({
      data: { tenantId: tenant.tenantId, ...data }
    });
  }

  update(id: number, data: Partial<{ label: string; color: string; sortOrder: number; isActive: boolean }>) {
    return this.prisma.status.update({ where: { id }, data });
  }
}
