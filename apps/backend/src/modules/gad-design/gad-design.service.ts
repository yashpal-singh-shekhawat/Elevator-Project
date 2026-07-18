import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs } from '@common/utils/pagination';
import { GadDesignRepository } from './gad-design.repository';
import { CreateGadDesignInput, UpdateGadDesignInput } from './gad-design.validation';

const SORT_FIELDS = ['id', 'version', 'createdAt'] as const;

export class GadDesignService {
  constructor(
    private readonly repo: GadDesignRepository,
    private readonly prisma: PrismaClient
  ) {}

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'version');
    const where = query.installationProjectId ? { installationProjectId: query.installationProjectId } : {};
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const design = await this.repo.findById(tenant, id);
    if (!design) throw new NotFoundError('GadDesign');
    return design;
  }

  async create(tenant: TenantContext, input: CreateGadDesignInput) {
    const latest = await this.repo.getLatestVersion(tenant.tenantId, input.installationProjectId);
    const version = latest ? latest.version + 1 : 1;
    // Get DRAFT status for GAD_DESIGN
    const draftStatus = await this.prisma.status.findFirst({
      where: { tenantId: tenant.tenantId, entityType: 'GAD_DESIGN', code: 'DRAFT' },
    });
    return this.repo.create(tenant, { ...input, version, statusId: draftStatus?.id });
  }

  async update(tenant: TenantContext, id: number, input: UpdateGadDesignInput) {
    await this.getById(tenant, id);
    return this.repo.update(id, input as any);
  }

  async submit(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.prisma.status.findFirst({
      where: { tenantId: tenant.tenantId, entityType: 'GAD_DESIGN', code: 'REVIEW_PENDING' },
    });
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async approve(tenant: TenantContext, id: number, reviewedById: number) {
    await this.getById(tenant, id);
    const status = await this.prisma.status.findFirst({
      where: { tenantId: tenant.tenantId, entityType: 'GAD_DESIGN', code: 'APPROVED' },
    });
    return this.repo.update(id, {
      status: { connect: { id: status?.id } },
      reviewedBy: { connect: { id: reviewedById } },
      reviewedAt: new Date(),
      approvedAt: new Date(),
    });
  }

  async requestChanges(tenant: TenantContext, id: number, reviewedById: number, revisionNotes: string) {
    await this.getById(tenant, id);
    const status = await this.prisma.status.findFirst({
      where: { tenantId: tenant.tenantId, entityType: 'GAD_DESIGN', code: 'REVISION_REQUESTED' },
    });
    return this.repo.update(id, {
      status: { connect: { id: status?.id } },
      reviewedBy: { connect: { id: reviewedById } },
      reviewedAt: new Date(),
      revisionNotes,
    });
  }
}
