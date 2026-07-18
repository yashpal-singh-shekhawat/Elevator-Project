import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const taskInclude = {
  status: { select: { id: true, code: true, label: true, color: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } }
} as const;

export class InstallationTaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.InstallationTaskWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.installationTask.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: taskInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.InstallationTaskWhereInput) {
    return this.prisma.installationTask.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.installationTask.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: taskInclude
    });
  }

  /** Used by other modules (e.g. checklist) to confirm a task exists & belongs to the tenant. */
  exists(tenant: TenantContext, id: number): Promise<boolean> {
    return this.prisma.installationTask
      .findFirst({ where: { id, tenantId: tenant.tenantId, deletedAt: null }, select: { id: true } })
      .then((row) => row !== null);
  }

  create(
    tenant: TenantContext,
    data: {
      installationProjectId: number;
      title: string;
      description?: string;
      statusId: number;
      sequence: number;
      assignedToId?: number;
      dueDate?: Date;
    }
  ) {
    return this.prisma.installationTask.create({
      data: { ...data, tenantId: tenant.tenantId },
      include: taskInclude
    });
  }

  update(id: number, data: Prisma.InstallationTaskUpdateInput) {
    return this.prisma.installationTask.update({ where: { id }, data, include: taskInclude });
  }

  softDelete(id: number) {
    return this.prisma.installationTask.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
