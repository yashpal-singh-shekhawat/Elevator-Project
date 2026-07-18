import { Prisma } from '@prisma/client';
import { InstallationProjectRepository } from './installation-project.repository';
import { CustomerRepository } from '@modules/customers/customer.repository';
import { SiteRepository } from '@modules/sites/site.repository';
import { LiftTypeRepository } from '@modules/master-data/lift-type/lift-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { UserRepository } from '@modules/users/user.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import {
  CompleteInstallationProjectInput,
  CreateInstallationProjectInput,
  ListInstallationProjectsQuery,
  UpdateInstallationProjectInput
} from './installation-project.validation';

const SORT_FIELDS = ['projectCode', 'plannedStartDate', 'createdAt'] as const;
const SEARCH_FIELDS = ['projectCode'] as const;
const PROJECT_STATUS_ENTITY_TYPE = 'INSTALLATION_PROJECT';
const LIFT_STATUS_ENTITY_TYPE = 'LIFT';
const COMPLETED_STATUS_CODE = 'COMPLETED';
const DEFAULT_NEW_LIFT_STATUS_CODE = 'INSTALLED';

export class InstallationProjectService {
  constructor(
    private readonly projectRepository: InstallationProjectRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly siteRepository: SiteRepository,
    private readonly liftTypeRepository: LiftTypeRepository,
    private readonly statusRepository: StatusRepository,
    private readonly userRepository: UserRepository
  ) {}

  async list(tenant: TenantContext, query: ListInstallationProjectsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.InstallationProjectWhereInput = {
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.assignedEngineerId ? { assignedEngineerId: query.assignedEngineerId } : {}),
      ...(buildSearchWhere(query.search, SEARCH_FIELDS) ?? {})
    };

    const [items, totalItems] = await Promise.all([
      this.projectRepository.findMany(tenant, where, listArgs),
      this.projectRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const project = await this.projectRepository.findById(tenant, id);
    if (!project) throw new NotFoundError('Installation project');
    return project;
  }

  async create(tenant: TenantContext, input: CreateInstallationProjectInput) {
    const [customer, site, liftType, status] = await Promise.all([
      this.customerRepository.findById(tenant, input.customerId),
      this.siteRepository.findById(tenant, input.siteId),
      this.liftTypeRepository.findById(tenant, input.liftTypeId),
      this.statusRepository.findActiveByEntityTypeAndId(tenant, PROJECT_STATUS_ENTITY_TYPE, input.statusId)
    ]);

    if (!customer) throw new BadRequestError('Invalid customerId');
    if (!site) throw new BadRequestError('Invalid siteId');
    if (site.customerId !== input.customerId) throw new BadRequestError('siteId does not belong to the given customerId');
    if (!liftType || !liftType.isActive) throw new BadRequestError('Invalid or inactive liftTypeId');
    if (!status) throw new BadRequestError(`Invalid statusId for entity type "${PROJECT_STATUS_ENTITY_TYPE}"`);

    if (input.assignedEngineerId) {
      await this.assertEngineerValid(tenant, input.assignedEngineerId);
    }

    return this.projectRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateInstallationProjectInput) {
    await this.getById(tenant, id);

    if (input.statusId) {
      const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, PROJECT_STATUS_ENTITY_TYPE, input.statusId);
      if (!status) throw new BadRequestError(`Invalid statusId for entity type "${PROJECT_STATUS_ENTITY_TYPE}"`);
    }
    if (input.assignedEngineerId) {
      await this.assertEngineerValid(tenant, input.assignedEngineerId);
    }

    return this.projectRepository.update(id, input);
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.projectRepository.softDelete(id);
  }

  /**
   * Completes an installation project: creates the physical Lift record
   * from the project's chosen liftType + site, links it back, and flips the
   * project to its "COMPLETED" status — all inside one DB transaction.
   */
  async complete(tenant: TenantContext, id: number, input: CompleteInstallationProjectInput) {
    const project = await this.getById(tenant, id);
    if (project.liftId) {
      throw new BadRequestError('This installation project has already been completed');
    }

    const [completedStatus, newLiftStatus] = await Promise.all([
      this.statusRepository.findByTenantEntityTypeAndCode(tenant, PROJECT_STATUS_ENTITY_TYPE, COMPLETED_STATUS_CODE),
      this.statusRepository.findByTenantEntityTypeAndCode(tenant, LIFT_STATUS_ENTITY_TYPE, DEFAULT_NEW_LIFT_STATUS_CODE)
    ]);

    if (!completedStatus) {
      throw new BadRequestError(`Master data missing: no "${COMPLETED_STATUS_CODE}" status seeded for ${PROJECT_STATUS_ENTITY_TYPE}`);
    }
    if (!newLiftStatus) {
      throw new BadRequestError(`Master data missing: no "${DEFAULT_NEW_LIFT_STATUS_CODE}" status seeded for ${LIFT_STATUS_ENTITY_TYPE}`);
    }

    return this.projectRepository.completeWithLift(tenant, id, completedStatus.id, {
      liftTypeId: project.liftType.id,
      siteId: project.site.id,
      statusId: newLiftStatus.id,
      ...input
    });
  }

  private async assertEngineerValid(tenant: TenantContext, userId: number): Promise<void> {
    const user = await this.userRepository.findById(tenant, userId);
    if (!user) throw new BadRequestError('Invalid assignedEngineerId');
  }
}
