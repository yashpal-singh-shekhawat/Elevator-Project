import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

const scheduleInclude = {
  status: { select: { id: true, code: true, label: true, color: true } },
  serviceType: { select: { id: true, code: true, name: true } }
} as const;

export class AmcScheduleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.AmcScheduleWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.amcSchedule.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: scheduleInclude,
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.AmcScheduleWhereInput) {
    return this.prisma.amcSchedule.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.amcSchedule.findFirst({ where: { id, tenantId: tenant.tenantId }, include: scheduleInclude });
  }

  exists(tenant: TenantContext, id: number): Promise<boolean> {
    return this.prisma.amcSchedule
      .findFirst({ where: { id, tenantId: tenant.tenantId }, select: { id: true } })
      .then((row) => row !== null);
  }

  create(tenant: TenantContext, data: { amcContractId: number; serviceTypeId: number; statusId: number; scheduledDate: Date }) {
    return this.prisma.amcSchedule.create({ data: { ...data, tenantId: tenant.tenantId }, include: scheduleInclude });
  }

  createMany(tenant: TenantContext, rows: Array<{ amcContractId: number; serviceTypeId: number; statusId: number; scheduledDate: Date }>) {
    return this.prisma.amcSchedule.createMany({
      data: rows.map((row) => ({ ...row, tenantId: tenant.tenantId }))
    });
  }

  update(id: number, data: Prisma.AmcScheduleUpdateInput) {
    return this.prisma.amcSchedule.update({ where: { id }, data, include: scheduleInclude });
  }
}
