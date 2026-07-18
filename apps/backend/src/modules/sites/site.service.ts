import { Prisma } from '@prisma/client';
import { SiteRepository } from './site.repository';
import { CustomerRepository } from '@modules/customers/customer.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import { CreateSiteInput, ListSitesQuery, UpdateSiteInput } from './site.validation';

const SORT_FIELDS = ['name', 'city', 'createdAt'] as const;
const SEARCH_FIELDS = ['name', 'city', 'pincode'] as const;

export class SiteService {
  constructor(
    private readonly siteRepository: SiteRepository,
    private readonly customerRepository: CustomerRepository
  ) {}

  async list(tenant: TenantContext, query: ListSitesQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'name');
    const where: Prisma.SiteWhereInput = {
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(buildSearchWhere(query.search, SEARCH_FIELDS) ?? {})
    };

    const [items, totalItems] = await Promise.all([
      this.siteRepository.findMany(tenant, where, listArgs),
      this.siteRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const site = await this.siteRepository.findById(tenant, id);
    if (!site) throw new NotFoundError('Site');
    return site;
  }

  async create(tenant: TenantContext, input: CreateSiteInput) {
    const customer = await this.customerRepository.findById(tenant, input.customerId);
    if (!customer) throw new BadRequestError('Invalid customerId');
    return this.siteRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateSiteInput) {
    await this.getById(tenant, id);
    return this.siteRepository.update(id, input);
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.siteRepository.softDelete(id);
  }
}
