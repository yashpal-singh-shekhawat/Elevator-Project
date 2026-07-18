import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class ServiceTicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      amcContract: { select: { id: true, contractNumber: true } },
      lift: { select: { id: true, serialNumber: true } },
      amcSchedule: { select: { id: true, scheduledDate: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.ServiceTicketWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.serviceTicket.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.ServiceTicketWhereInput) {
    return this.prisma.serviceTicket.count({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
    });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.serviceTicket.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: this.include,
    });
  }

  // Count closed tickets for a lift in last N days (for escalation check)
  countRecentClosedByLift(tenantId: number, liftId: number, windowDays: number) {
    const since = new Date();
    since.setDate(since.getDate() - windowDays);
    return this.prisma.serviceTicket.count({
      where: {
        tenantId,
        liftId,
        closedAt: { gte: since },
      },
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.serviceTicket.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.ServiceTicketUpdateInput) {
    return this.prisma.serviceTicket.update({ where: { id }, data, include: this.include });
  }
}
