import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class GadDesignRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.GadDesignWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.gadDesign.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.GadDesignWhereInput) {
    return this.prisma.gadDesign.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.gadDesign.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  getLatestVersion(tenantId: number, installationProjectId: number) {
    return this.prisma.gadDesign.findFirst({
      where: { tenantId, installationProjectId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.gadDesign.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.GadDesignUpdateInput) {
    return this.prisma.gadDesign.update({ where: { id }, data, include: this.include });
  }
}
