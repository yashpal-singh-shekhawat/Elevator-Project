import { Prisma } from '@prisma/client';
import { InstallationTaskRepository } from './installation-task.repository';
import { InstallationProjectRepository } from '@modules/installation-project/installation-project.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { UserRepository } from '@modules/users/user.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import {
  CreateInstallationTaskInput,
  ListInstallationTasksQuery,
  UpdateInstallationTaskInput
} from './installation-task.validation';

const SORT_FIELDS = ['sequence', 'dueDate', 'createdAt'] as const;
const TASK_STATUS_ENTITY_TYPE = 'INSTALLATION_TASK';
const COMPLETED_STATUS_CODE = 'COMPLETED';

export class InstallationTaskService {
  constructor(
    private readonly taskRepository: InstallationTaskRepository,
    private readonly projectRepository: InstallationProjectRepository,
    private readonly statusRepository: StatusRepository,
    private readonly userRepository: UserRepository
  ) {}

  async list(tenant: TenantContext, query: ListInstallationTasksQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'sequence');
    const where: Prisma.InstallationTaskWhereInput = {
      installationProjectId: query.installationProjectId,
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {})
    };

    const [items, totalItems] = await Promise.all([
      this.taskRepository.findMany(tenant, where, listArgs),
      this.taskRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const task = await this.taskRepository.findById(tenant, id);
    if (!task) throw new NotFoundError('Installation task');
    return task;
  }

  async create(tenant: TenantContext, input: CreateInstallationTaskInput) {
    const project = await this.projectRepository.findById(tenant, input.installationProjectId);
    if (!project) throw new BadRequestError('Invalid installationProjectId');

    const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, TASK_STATUS_ENTITY_TYPE, input.statusId);
    if (!status) throw new BadRequestError(`Invalid statusId for entity type "${TASK_STATUS_ENTITY_TYPE}"`);

    if (input.assignedToId) {
      await this.assertUserValid(tenant, input.assignedToId);
    }

    return this.taskRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateInstallationTaskInput) {
    await this.getById(tenant, id);

    let completedAt: Date | undefined;
    if (input.statusId) {
      const status = await this.statusRepository.findActiveByEntityTypeAndId(tenant, TASK_STATUS_ENTITY_TYPE, input.statusId);
      if (!status) throw new BadRequestError(`Invalid statusId for entity type "${TASK_STATUS_ENTITY_TYPE}"`);
      if (status.code === COMPLETED_STATUS_CODE) completedAt = new Date();
    }
    if (input.assignedToId) {
      await this.assertUserValid(tenant, input.assignedToId);
    }

    return this.taskRepository.update(id, { ...input, ...(completedAt ? { completedAt } : {}) });
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.taskRepository.softDelete(id);
  }

  private async assertUserValid(tenant: TenantContext, userId: number): Promise<void> {
    const user = await this.userRepository.findById(tenant, userId);
    if (!user) throw new BadRequestError('Invalid assignedToId');
  }
}
