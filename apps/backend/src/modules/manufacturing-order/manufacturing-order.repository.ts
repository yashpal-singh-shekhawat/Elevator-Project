import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class ManufacturingOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      releasedBy: { select: { id: true, firstName: true, lastName: true } },
      qcPassedBy: { select: { id: true, firstName: true, lastName: true } },
      installationProject: { select: { id: true, title: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.ManufacturingOrderWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.manufacturingOrder.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.ManufacturingOrderWhereInput) {
    return this.prisma.manufacturingOrder.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.manufacturingOrder.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.manufacturingOrder.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.ManufacturingOrderUpdateInput) {
    return this.prisma.manufacturingOrder.update({ where: { id }, data, include: this.include });
  }
}
