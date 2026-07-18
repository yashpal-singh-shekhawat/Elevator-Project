import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs } from '@common/utils/pagination';
import { DispatchRepository } from './dispatch.repository';
import { CreateDispatchInput, UpdateDispatchInput } from './dispatch.validation';

const SORT_FIELDS = ['id', 'dispatchCode', 'createdAt'] as const;

export class DispatchService {
  constructor(
    private readonly repo: DispatchRepository,
    private readonly prisma: PrismaClient
  ) {}

  private async getStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({
      where: { tenantId, entityType: 'DISPATCH', code },
    });
  }

  private async getProjectStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({
      where: { tenantId, entityType: 'INSTALLATION_PROJECT', code },
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
    const dispatch = await this.repo.findById(tenant, id);
    if (!dispatch) throw new NotFoundError('Dispatch');
    return dispatch;
  }

  async create(tenant: TenantContext, input: CreateDispatchInput, dispatchedById: number) {
    const status = await this.getStatus(tenant.tenantId, 'DISPATCHED');
    const projectStatus = await this.getProjectStatus(tenant.tenantId, 'IN_TRANSIT');

    const dispatch = await this.repo.create(tenant, {
      ...input,
      dispatchCode: `DIS-${Date.now()}`,
      statusId: status?.id,
      dispatchedById,
      dispatchedAt: new Date(),
    });

    // Update project status to IN_TRANSIT
    if (projectStatus) {
      await this.prisma.installationProject.update({
        where: { id: input.installationProjectId },
        data: { statusId: projectStatus.id },
      });
    }

    return dispatch;
  }

  async update(tenant: TenantContext, id: number, input: UpdateDispatchInput) {
    await this.getById(tenant, id);
    return this.repo.update(id, input as any);
  }

  async validateDelivery(
    tenant: TenantContext,
    id: number,
    hasException: boolean,
    exceptionNotes: string | undefined,
    validatedById: number
  ) {
    const dispatch = await this.getById(tenant, id);

    if (hasException) {
      const exceptionStatus = await this.getStatus(tenant.tenantId, 'EXCEPTION');
      return this.repo.update(id, {
        status: { connect: { id: exceptionStatus?.id } },
        exceptionNotes: exceptionNotes ?? '',
      });
    }

    // No exception — mark delivered + update project status
    const deliveredStatus = await this.getStatus(tenant.tenantId, 'DELIVERED');
    const projectStatus = await this.getProjectStatus(tenant.tenantId, 'MATERIAL_RECEIVED_SITE');

    const updated = await this.repo.update(id, {
      status: { connect: { id: deliveredStatus?.id } },
      deliveryValidatedBy: { connect: { id: validatedById } },
      deliveredAt: new Date(),
    });

    if (projectStatus) {
      await this.prisma.installationProject.update({
        where: { id: dispatch.installationProjectId },
        data: { statusId: projectStatus.id },
      });
    }

    return updated;
  }
}
