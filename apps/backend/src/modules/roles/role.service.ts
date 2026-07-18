import { RoleRepository } from './role.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ConflictError, NotFoundError, BadRequestError } from '@common/errors';
import { CreateRoleInput, UpdateRoleInput } from './role.validation';

// The ADMIN role is provisioned for every tenant and always holds all
// permissions. It is protected from deletion and permission edits so a tenant
// can never lock itself out of user/role management.
const PROTECTED_ROLE_CODE = 'ADMIN';

interface RoleView {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isSystem: boolean; // true → cannot be deleted / permissions locked (ADMIN)
  userCount: number;
  permissionCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

type RoleWithRelations = Awaited<ReturnType<RoleRepository['findRoleById']>>;

function toRoleView(role: NonNullable<RoleWithRelations>): RoleView {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isActive: role.isActive,
    isSystem: role.code === PROTECTED_ROLE_CODE,
    userCount: role._count.users,
    permissionCodes: role.rolePermissions.map((rp) => rp.permission.code),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt
  };
}

export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  // --- Permissions master list (grouped by module for the checkbox matrix) ---
  async listPermissions() {
    const permissions = await this.roleRepository.findAllPermissions();
    const groups = new Map<string, { code: string; description: string | null }[]>();
    for (const p of permissions) {
      const list = groups.get(p.module) ?? [];
      list.push({ code: p.code, description: p.description });
      groups.set(p.module, list);
    }
    return Array.from(groups.entries()).map(([module, items]) => ({ module, permissions: items }));
  }

  // --- Roles ---
  async list(tenant: TenantContext) {
    const roles = await this.roleRepository.findManyRoles(tenant);
    return roles.map(toRoleView);
  }

  async getById(tenant: TenantContext, id: number) {
    const role = await this.roleRepository.findRoleById(tenant, id);
    if (!role) throw new NotFoundError('Role');
    return toRoleView(role);
  }

  async create(tenant: TenantContext, input: CreateRoleInput) {
    const existing = await this.roleRepository.findRoleByCode(tenant, input.code);
    if (existing) throw new ConflictError('A role with this code already exists');

    const role = await this.roleRepository.createRole(tenant, {
      code: input.code,
      name: input.name,
      description: input.description || undefined
    });
    return toRoleView(role);
  }

  async update(tenant: TenantContext, id: number, input: UpdateRoleInput) {
    await this.getById(tenant, id); // 404s if missing / wrong tenant

    const role = await this.roleRepository.updateRole(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
    });
    return toRoleView(role);
  }

  async remove(tenant: TenantContext, id: number): Promise<void> {
    const role = await this.getById(tenant, id);
    if (role.isSystem) throw new BadRequestError('The Admin role cannot be deleted');
    if (role.userCount > 0) {
      throw new ConflictError('Reassign the users on this role before deleting it');
    }
    await this.roleRepository.deleteRole(id);
  }

  // Core of the checkbox matrix: replace a role's permission set to exactly the
  // provided codes. Unknown codes are rejected so the token snapshot stays valid.
  async setPermissions(tenant: TenantContext, id: number, permissionCodes: string[]) {
    const role = await this.getById(tenant, id);
    if (role.isSystem) throw new BadRequestError('The Admin role always has all permissions');

    const codes = Array.from(new Set(permissionCodes));
    const permissions = codes.length ? await this.roleRepository.findPermissionsByCodes(codes) : [];
    if (permissions.length !== codes.length) {
      throw new BadRequestError('One or more permission codes are invalid');
    }

    await this.roleRepository.replaceRolePermissions(
      id,
      permissions.map((p) => p.id)
    );
    return this.getById(tenant, id);
  }
}
