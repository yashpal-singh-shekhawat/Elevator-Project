import { Prisma } from '@prisma/client';
import { CustomerRepository } from './customer.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { NotFoundError } from '@common/errors';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validation';

const SORT_FIELDS = ['name', 'createdAt'] as const;
const SEARCH_FIELDS = ['name', 'email', 'phone'] as const;

export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async list(tenant: TenantContext, query: ListQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'name');
    const where: Prisma.CustomerWhereInput = buildSearchWhere(query.search, SEARCH_FIELDS) ?? {};

    const [items, totalItems] = await Promise.all([
      this.customerRepository.findMany(tenant, where, listArgs),
      this.customerRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const customer = await this.customerRepository.findById(tenant, id);
    if (!customer) throw new NotFoundError('Customer');
    return customer;
  }

  create(tenant: TenantContext, input: CreateCustomerInput) {
    return this.customerRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateCustomerInput) {
    await this.getById(tenant, id);
    return this.customerRepository.update(id, input);
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.customerRepository.softDelete(id);
  }
}
