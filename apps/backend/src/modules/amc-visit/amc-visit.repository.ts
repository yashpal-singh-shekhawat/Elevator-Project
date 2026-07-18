import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const visitInclude = {
  status: { select: { id: true, code: true, label: true, color: true } },
  serviceType: { select: { id: true, code: true, name: true } },
  technician: { select: { id: true, firstName: true, lastName: true, email: true } },
  lift: { select: { id: true, serialNumber: true } }
} as const;

export class AmcVisitRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.AmcVisitWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.amcVisit.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: visitInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.AmcVisitWhereInput) {
    return this.prisma.amcVisit.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.amcVisit.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: visitInclude
    });
  }

  /** Used by the checklist module to confirm a visit exists & belongs to the tenant. */
  exists(tenant: TenantContext, id: number): Promise<boolean> {
    return this.prisma.amcVisit
      .findFirst({ where: { id, tenantId: tenant.tenantId, deletedAt: null }, select: { id: true } })
      .then((row) => row !== null);
  }

  create(
    tenant: TenantContext,
    data: {
      amcContractId: number;
      amcScheduleId?: number;
      liftId: number;
      serviceTypeId: number;
      statusId: number;
      technicianId?: number;
      visitDate: Date;
    }
  ) {
    return this.prisma.amcVisit.create({ data: { ...data, tenantId: tenant.tenantId }, include: visitInclude });
  }

  update(id: number, data: Prisma.AmcVisitUpdateInput) {
    return this.prisma.amcVisit.update({ where: { id }, data, include: visitInclude });
  }

  softDelete(id: number) {
    return this.prisma.amcVisit.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
