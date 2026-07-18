import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';
import { CreatePaymentInput } from './payment.validation';

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      verifiedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.PaymentWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.payment.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.PaymentWhereInput) {
    return this.prisma.payment.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.payment.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: CreatePaymentInput) {
    return this.prisma.payment.create({
      data: {
        tenantId: tenant.tenantId,
        organizationId: tenant.organizationId,
        entityType: data.entityType,
        entityId: data.entityId,
        quotationId: data.quotationId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      },
      include: this.include,
    });
  }

  verify(id: number, verifiedById: number, notes?: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { verifiedById, verifiedAt: new Date(), ...(notes ? { notes } : {}) },
      include: this.include,
    });
  }
}
