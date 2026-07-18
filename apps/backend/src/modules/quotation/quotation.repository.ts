import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class QuotationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      lead: { select: { id: true, leadCode: true, vertical: true } },
      status: { select: { id: true, code: true, label: true, color: true } },
      preparedBy: { select: { id: true, firstName: true, lastName: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.QuotationWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.quotation.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.QuotationWhereInput) {
    return this.prisma.quotation.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.quotation.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  getLatestVersionForLead(tenantId: number, leadId: number) {
    return this.prisma.quotation.findFirst({
      where: { tenantId, leadId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.quotation.create({
      data: {
        ...data,
        tenantId: tenant.tenantId,
        organizationId: tenant.organizationId,
        quotationCode: `QT-${Date.now()}`,
      },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.QuotationUpdateInput) {
    return this.prisma.quotation.update({ where: { id }, data, include: this.include });
  }
}
