import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const contractInclude = {
  customer: { select: { id: true, name: true } },
  lift: { select: { id: true, serialNumber: true } },
  status: { select: { id: true, code: true, label: true, color: true } },
  serviceType: { select: { id: true, code: true, name: true } }
} as const;

export class AmcContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.AmcContractWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.amcContract.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: contractInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.AmcContractWhereInput) {
    return this.prisma.amcContract.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.amcContract.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: contractInclude
    });
  }

  /** Used by AmcVisit/AmcSchedule modules to confirm a contract exists & belongs to the tenant. */
  exists(tenant: TenantContext, id: number): Promise<boolean> {
    return this.prisma.amcContract
      .findFirst({ where: { id, tenantId: tenant.tenantId, deletedAt: null }, select: { id: true } })
      .then((row) => row !== null);
  }

  create(
    tenant: TenantContext,
    data: {
      contractNumber: string;
      customerId: number;
      liftId: number;
      statusId: number;
      serviceTypeId: number;
      startDate: Date;
      endDate: Date;
      contractValue?: number;
      numberOfServicesPerYear: number;
      tier?: string;
      autoRenew: boolean;
    }
  ) {
    return this.prisma.amcContract.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: contractInclude
    });
  }

  update(id: number, data: Prisma.AmcContractUpdateInput) {
    return this.prisma.amcContract.update({ where: { id }, data, include: contractInclude });
  }

  softDelete(id: number) {
    return this.prisma.amcContract.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
