import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.UserWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.user.findMany({
      where: { tenantId: tenant.tenantId, deletedAt: null, ...where },
      include: { role: true },
      ...listArgs
    });
  }

  count(tenant: TenantContext, where: Prisma.UserWhereInput) {
    return this.prisma.user.count({ where: { tenantId: tenant.tenantId, deletedAt: null, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.user.findFirst({
      where: { id, tenantId: tenant.tenantId, deletedAt: null },
      include: { role: true }
    });
  }

  findByEmail(tenant: TenantContext, email: string) {
    return this.prisma.user.findFirst({ where: { tenantId: tenant.tenantId, email, deletedAt: null } });
  }

  create(tenant: TenantContext, data: Prisma.UserUncheckedCreateInput) {
    return this.prisma.user.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: { role: true }
    });
  }

  update(id: number, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, include: { role: true } });
  }

  softDelete(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });
  }

  findRoleById(tenant: TenantContext, roleId: number) {
    return this.prisma.role.findFirst({ where: { id: roleId, tenantId: tenant.tenantId, isActive: true } });
  }
}
