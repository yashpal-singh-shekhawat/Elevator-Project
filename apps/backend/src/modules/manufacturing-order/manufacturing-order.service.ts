import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs } from '@common/utils/pagination';
import { ManufacturingOrderRepository } from './manufacturing-order.repository';
import { CreateManufacturingOrderInput, UpdateManufacturingOrderInput } from './manufacturing-order.validation';

const SORT_FIELDS = ['id', 'orderCode', 'createdAt'] as const;

export class ManufacturingOrderService {
  constructor(
    private readonly repo: ManufacturingOrderRepository,
    private readonly prisma: PrismaClient
  ) {}

  private async getStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({
      where: { tenantId, entityType: 'MANUFACTURING_ORDER', code },
    });
  }

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where = query.installationProjectId ? { installationProjectId: query.installationProjectId } : {};
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const order = await this.repo.findById(tenant, id);
    if (!order) throw new NotFoundError('ManufacturingOrder');
    return order;
  }

  async create(tenant: TenantContext, input: CreateManufacturingOrderInput, releasedById: number) {
    const status = await this.getStatus(tenant.tenantId, 'RELEASED');
    return this.repo.create(tenant, {
      ...input,
      orderCode: `MO-${Date.now()}`,
      statusId: status?.id,
      releasedById,
      releasedAt: new Date(),
    });
  }

  async update(tenant: TenantContext, id: number, input: UpdateManufacturingOrderInput) {
    await this.getById(tenant, id);
    return this.repo.update(id, input as any);
  }

  async qcPass(tenant: TenantContext, id: number, qcPassedById: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'QC_PASSED');
    return this.repo.update(id, {
      status: { connect: { id: status?.id } },
      qcPassedBy: { connect: { id: qcPassedById } },
      qcPassedAt: new Date(),
    });
  }

  async qcFail(tenant: TenantContext, id: number, reason: string) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'QC_PENDING');
    return this.repo.update(id, {
      status: { connect: { id: status?.id } },
      notes: reason,
    });
  }

  async markReadyForDispatch(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'READY_FOR_DISPATCH');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }
}
