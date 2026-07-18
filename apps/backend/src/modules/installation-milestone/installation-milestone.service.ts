import { Prisma } from '@prisma/client';
import { InstallationMilestoneRepository } from './installation-milestone.repository';
import { InstallationProjectRepository } from '@modules/installation-project/installation-project.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { TenantContext, AuthenticatedUser } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import {
  CreateInstallationMilestoneInput,
  ListInstallationMilestonesQuery,
  SignOffMilestoneInput,
  UpdateInstallationMilestoneInput
} from './installation-milestone.validation';

const SORT_FIELDS = ['name', 'createdAt'] as const;
// Milestones reuse INSTALLATION_PROJECT statuses (see schema.prisma comment on this model).
const MILESTONE_STATUS_ENTITY_TYPE = 'INSTALLATION_PROJECT';

export class InstallationMilestoneService {
  constructor(
    private readonly milestoneRepository: InstallationMilestoneRepository,
    private readonly projectRepository: InstallationProjectRepository,
    private readonly statusRepository: StatusRepository
  ) {}

  async list(tenant: TenantContext, query: ListInstallationMilestonesQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.InstallationMilestoneWhereInput = { installationProjectId: query.installationProjectId };

    const [items, totalItems] = await Promise.all([
      this.milestoneRepository.findMany(tenant, where, listArgs),
      this.milestoneRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const milestone = await this.milestoneRepository.findById(tenant, id);
    if (!milestone) throw new NotFoundError('Installation milestone');
    return milestone;
  }

  async create(tenant: TenantContext, input: CreateInstallationMilestoneInput) {
    const project = await this.projectRepository.findById(tenant, input.installationProjectId);
    if (!project) throw new BadRequestError('Invalid installationProjectId');

    const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, MILESTONE_STATUS_ENTITY_TYPE, input.statusId);
    if (!status) throw new BadRequestError(`Invalid statusId for entity type "${MILESTONE_STATUS_ENTITY_TYPE}"`);

    return this.milestoneRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateInstallationMilestoneInput) {
    await this.getById(tenant, id);

    if (input.statusId) {
      const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, MILESTONE_STATUS_ENTITY_TYPE, input.statusId);
      if (!status) throw new BadRequestError(`Invalid statusId for entity type "${MILESTONE_STATUS_ENTITY_TYPE}"`);
    }

    return this.milestoneRepository.update(id, input);
  }

  async signOff(tenant: TenantContext, id: number, user: AuthenticatedUser, input: SignOffMilestoneInput) {
    const milestone = await this.getById(tenant, id);
    if (milestone.signOffAt) {
      throw new BadRequestError('This milestone has already been signed off');
    }
    return this.milestoneRepository.signOff(id, user.id, input.remarks);
  }
}
