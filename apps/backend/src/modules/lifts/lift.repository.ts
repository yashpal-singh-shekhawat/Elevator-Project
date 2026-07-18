import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const liftInclude = {
  site: { select: { id: true, name: true, customerId: true } },
  liftType: { select: { id: true, code: true, name: true } },
  status: { select: { id: true, code: true, label: true, color: true } }
} as const;

export class LiftRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.LiftWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.lift.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: liftInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.LiftWhereInput) {
    return this.prisma.lift.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.lift.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: liftInclude
    });
  }

  findBySerialNumber(tenant: TenantContext, serialNumber: string) {
    return this.prisma.lift.findFirst({ where: { tenantId: tenant.tenantId, serialNumber } });
  }

  create(
    tenant: TenantContext,
    data: {
      siteId: number;
      liftTypeId: number;
      statusId: number;
      serialNumber: string;
      model?: string;
      capacityKg?: number;
      numberOfFloors?: number;
      installationDate?: Date;
      warrantyExpiryDate?: Date;
    }
  ) {
    return this.prisma.lift.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: liftInclude
    });
  }

  update(id: number, data: Prisma.LiftUpdateInput) {
    return this.prisma.lift.update({ where: { id }, data, include: liftInclude });
  }

  softDelete(id: number) {
    return this.prisma.lift.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
