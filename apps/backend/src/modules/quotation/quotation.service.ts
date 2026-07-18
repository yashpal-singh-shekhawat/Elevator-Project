import { Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { QuotationRepository } from './quotation.repository';
import { CreateQuotationInput, UpdateQuotationInput, ListQuotationsQuery } from './quotation.validation';

const SORT_FIELDS = ['id', 'quotationCode', 'version', 'totalAmount', 'createdAt'] as const;
const SEARCH_FIELDS = ['quotationCode'] as const;

export class QuotationService {
  constructor(private readonly quotationRepository: QuotationRepository) {}

  async list(tenant: TenantContext, query: ListQuotationsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const searchWhere = buildSearchWhere(query.search, SEARCH_FIELDS) ?? {};
    const where: Prisma.QuotationWhereInput = {
      ...searchWhere,
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.quotationRepository.findMany(tenant, where, listArgs),
      this.quotationRepository.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const q = await this.quotationRepository.findById(tenant, id);
    if (!q) throw new NotFoundError('Quotation');
    return q;
  }

  async create(tenant: TenantContext, input: CreateQuotationInput) {
    const latest = await this.quotationRepository.getLatestVersionForLead(tenant.tenantId, input.leadId);
    const version = latest ? latest.version + 1 : 1;
    // `validUntil` arrives as a date-only string ("2026-07-25") from the form;
    // Prisma's DateTime column needs a real Date, so coerce it here.
    const validUntil = input.validUntil ? new Date(input.validUntil) : undefined;
    return this.quotationRepository.create(tenant, { ...input, validUntil, version });
  }

  async update(tenant: TenantContext, id: number, input: UpdateQuotationInput) {
    await this.getById(tenant, id);
    // Same date-only coercion as create — the DateTime column needs a real Date.
    const validUntil = input.validUntil ? new Date(input.validUntil) : undefined;
    return this.quotationRepository.update(id, { ...input, validUntil } as any);
  }

  async approve(tenant: TenantContext, id: number, approvedById: number, notes?: string) {
    const q = await this.getById(tenant, id);
    // Find APPROVED status for QUOTATION entity type
    return this.quotationRepository.update(id, {
      approvedBy: { connect: { id: approvedById } },
      approvedAt: new Date(),
      notes: notes ?? q.notes,
    });
  }

  async reject(tenant: TenantContext, id: number, rejectionReason: string) {
    await this.getById(tenant, id);
    return this.quotationRepository.update(id, { rejectionReason } as any);
  }

  // Revise = create new version linked to same lead
  async revise(tenant: TenantContext, id: number) {
    const original = await this.getById(tenant, id);
    return this.create(tenant, {
      leadId: original.leadId,
      tier: original.tier as any,
      statusId: original.statusId,
      totalAmount: original.totalAmount ? Number(original.totalAmount) : undefined,
      notes: original.notes ?? undefined,
    });
  }
}
