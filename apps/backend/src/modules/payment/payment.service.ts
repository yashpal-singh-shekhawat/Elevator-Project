import { Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs } from '@common/utils/pagination';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentInput, ListPaymentsQuery } from './payment.validation';

const SORT_FIELDS = ['id', 'amount', 'createdAt'] as const;

export class PaymentService {
  constructor(private readonly paymentRepository: PaymentRepository) {}

  async list(tenant: TenantContext, query: ListPaymentsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.PaymentWhereInput = {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.paymentRepository.findMany(tenant, where, listArgs),
      this.paymentRepository.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const p = await this.paymentRepository.findById(tenant, id);
    if (!p) throw new NotFoundError('Payment');
    return p;
  }

  create(tenant: TenantContext, input: CreatePaymentInput) {
    return this.paymentRepository.create(tenant, input);
  }

  async verify(tenant: TenantContext, id: number, verifiedById: number, notes?: string) {
    await this.getById(tenant, id);
    return this.paymentRepository.verify(id, verifiedById, notes);
  }
}
