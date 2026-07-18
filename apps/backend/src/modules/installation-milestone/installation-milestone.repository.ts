import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const milestoneInclude = {
  status: { select: { id: true, code: true, label: true, color: true } }
} as const;

export class InstallationMilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.InstallationMilestoneWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.installationMilestone.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: milestoneInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.InstallationMilestoneWhereInput) {
    return this.prisma.installationMilestone.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.installationMilestone.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: milestoneInclude
    });
  }

  create(tenant: TenantContext, data: { installationProjectId: number; name: string; statusId: number; remarks?: string }) {
    return this.prisma.installationMilestone.create({
      data: { ...data, tenantId: tenant.tenantId },
      include: milestoneInclude
    });
  }

  update(id: number, data: Prisma.InstallationMilestoneUpdateInput) {
    return this.prisma.installationMilestone.update({ where: { id }, data, include: milestoneInclude });
  }

  signOff(id: number, signOffById: number, remarks?: string) {
    return this.prisma.installationMilestone.update({
      where: { id },
      data: { signOffById, signOffAt: new Date(), ...(remarks ? { remarks } : {}) },
      include: milestoneInclude
    });
  }
}
