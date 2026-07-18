import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';

export class WorkflowTransitionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      fromStatus: { select: { id: true, code: true, label: true, color: true } },
      toStatus: { select: { id: true, code: true, label: true, color: true } },
      actionedBy: { select: { id: true, firstName: true, lastName: true } }
    };
  }

  findMany(tenant: TenantContext, entityType: string, entityId: number, skip: number, take: number) {
    return this.prisma.workflowTransition.findMany({
      where: { tenantId: tenant.tenantId, entityType, entityId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  count(tenant: TenantContext, entityType: string, entityId: number) {
    return this.prisma.workflowTransition.count({
      where: { tenantId: tenant.tenantId, entityType, entityId },
    });
  }

  create(
    tenant: TenantContext,
    entityType: string,
    entityId: number,
    fromStatusId: number | undefined,
    toStatusId: number,
    actionedById: number,
    remarks?: string
  ) {
    return this.prisma.workflowTransition.create({
      data: {
        tenantId: tenant.tenantId,
        organizationId: tenant.organizationId,
        entityType,
        entityId,
        fromStatusId,
        toStatusId,
        actionedById,
        remarks,
      },
    });
  }
}
