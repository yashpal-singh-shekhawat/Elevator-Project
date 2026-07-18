import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';

export class RoleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --- Permissions (platform-fixed master list; not tenant-scoped) ---
  findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { code: 'asc' }] });
  }

  findPermissionsByCodes(codes: string[]) {
    return this.prisma.permission.findMany({ where: { code: { in: codes } } });
  }

  // --- Roles (tenant-scoped) ---
  findManyRoles(tenant: TenantContext) {
    return this.prisma.role.findMany({
      where: { tenantId: tenant.tenantId },
      orderBy: { name: 'asc' },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
  }

  findRoleById(tenant: TenantContext, id: number) {
    return this.prisma.role.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
  }

  findRoleByCode(tenant: TenantContext, code: string) {
    return this.prisma.role.findFirst({ where: { tenantId: tenant.tenantId, code } });
  }

  createRole(tenant: TenantContext, data: { code: string; name: string; description?: string }) {
    return this.prisma.role.create({
      data: {
        tenantId: tenant.tenantId,
        code: data.code,
        name: data.name,
        description: data.description
      },
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
  }

  updateRole(id: number, data: Prisma.RoleUpdateInput) {
    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { users: true } }
      }
    });
  }

  deleteRole(id: number) {
    return this.prisma.role.delete({ where: { id } });
  }

  // Replace a role's permission rows to match the given permission ids exactly.
  // Done in a transaction so the matrix save is atomic.
  async replaceRolePermissions(roleId: number, permissionIds: number[]) {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true
      })
    ]);
  }
}
