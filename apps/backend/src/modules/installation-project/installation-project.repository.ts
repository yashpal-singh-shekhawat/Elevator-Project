import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const projectInclude = {
  customer: { select: { id: true, name: true } },
  site: { select: { id: true, name: true, city: true } },
  liftType: { select: { id: true, code: true, name: true } },
  status: { select: { id: true, code: true, label: true, color: true } },
  lift: { select: { id: true, serialNumber: true } }
} as const;

export class InstallationProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.InstallationProjectWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.installationProject.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: projectInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.InstallationProjectWhereInput) {
    return this.prisma.installationProject.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.installationProject.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: projectInclude
    });
  }

  create(
    tenant: TenantContext,
    data: {
      projectCode: string;
      customerId: number;
      siteId: number;
      liftTypeId: number;
      statusId: number;
      assignedEngineerId?: number;
      plannedStartDate?: Date;
      plannedEndDate?: Date;
    }
  ) {
    return this.prisma.installationProject.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: projectInclude
    });
  }

  update(id: number, data: Prisma.InstallationProjectUpdateInput) {
    return this.prisma.installationProject.update({ where: { id }, data, include: projectInclude });
  }

  softDelete(id: number) {
    return this.prisma.installationProject.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /**
   * Atomically creates the Lift record and links it back to the project,
   * marking the project complete. Both writes happen in one transaction so
   * a failure partway through never leaves a Lift without its originating
   * project, or a "completed" project without a Lift.
   */
  completeWithLift(
    tenant: TenantContext,
    projectId: number,
    completedStatusId: number,
    liftData: {
      liftTypeId: number;
      siteId: number;
      statusId: number;
      serialNumber: string;
      model?: string;
      capacityKg?: number;
      numberOfFloors?: number;
      installationDate?: Date;
      warrantyExpiryDate?: Date;
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      const lift = await tx.lift.create({
        data: { ...liftData, tenantId: tenant.tenantId, organizationId: tenant.organizationId }
      });

      const project = await tx.installationProject.update({
        where: { id: projectId },
        data: { liftId: lift.id, statusId: completedStatusId, actualEndDate: new Date() },
        include: projectInclude
      });

      return { lift, project };
    });
  }
}
