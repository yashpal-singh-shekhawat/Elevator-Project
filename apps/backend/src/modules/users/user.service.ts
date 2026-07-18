import { Prisma } from '@prisma/client';
import { UserRepository } from './user.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { ConflictError, NotFoundError, BadRequestError } from '@common/errors';
import { hashPassword } from '@common/utils/hash';
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from './user.validation';

const SORT_FIELDS = ['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt'] as const;
const SEARCH_FIELDS = ['firstName', 'lastName', 'email'] as const;

// passwordHash must never leave the service boundary.
function toSafeUser<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async list(tenant: TenantContext, query: ListUsersQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.UserWhereInput = {
      ...(query.roleId ? { roleId: query.roleId } : {}),
      ...(buildSearchWhere(query.search, SEARCH_FIELDS) ?? {})
    };

    const [users, totalItems] = await Promise.all([
      this.userRepository.findMany(tenant, where, listArgs),
      this.userRepository.count(tenant, where)
    ]);

    return { items: users.map(toSafeUser), totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const user = await this.userRepository.findById(tenant, id);
    if (!user) throw new NotFoundError('User');
    return toSafeUser(user);
  }

  async create(tenant: TenantContext, input: CreateUserInput) {
    const [existingEmail, role] = await Promise.all([
      this.userRepository.findByEmail(tenant, input.email),
      this.userRepository.findRoleById(tenant, input.roleId)
    ]);

    if (existingEmail) throw new ConflictError('A user with this email already exists');
    if (!role) throw new BadRequestError('Invalid roleId');

    const passwordHash = await hashPassword(input.password);
    const user = await this.userRepository.create(tenant, {
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: input.roleId
    } as Prisma.UserUncheckedCreateInput);

    return toSafeUser(user);
  }

  async update(tenant: TenantContext, id: number, input: UpdateUserInput) {
    await this.getById(tenant, id); // 404s if missing/wrong tenant

    if (input.roleId) {
      const role = await this.userRepository.findRoleById(tenant, input.roleId);
      if (!role) throw new BadRequestError('Invalid roleId');
    }

    const user = await this.userRepository.update(id, input);
    return toSafeUser(user);
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.userRepository.softDelete(id);
  }
}
