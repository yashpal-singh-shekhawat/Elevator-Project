import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class DispatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      dispatchedBy: { select: { id: true, firstName: true, lastName: true } },
      deliveryValidatedBy: { select: { id: true, firstName: true, lastName: true } },
      installationProject: { select: { id: true, title: true } },
      manufacturingOrder: { select: { id: true, orderCode: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.DispatchWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.dispatch.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.DispatchWhereInput) {
    return this.prisma.dispatch.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.dispatch.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.dispatch.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.DispatchUpdateInput) {
    return this.prisma.dispatch.update({ where: { id }, data, include: this.include });
  }
}
