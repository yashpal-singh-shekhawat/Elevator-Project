import { Prisma, PrismaClient } from '@prisma/client';

export const userWithRoleInclude = {
  role: {
    include: {
      rolePermissions: { include: { permission: true } }
    }
  }
} as const;

export type UserWithRole = Prisma.UserGetPayload<{ include: typeof userWithRoleInclude }>;

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // --- Tenant resolution (by URL slug / by id) ----------------------------

  findTenantBySlug(slug: string) {
    return this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, isActive: true, logoUrl: true }
    });
  }

  findTenantById(id: number) {
    return this.prisma.tenant.findUnique({
      where: { id },
      select: { id: true, slug: true, name: true, isActive: true }
    });
  }

  /**
   * Phase 1 kept a single organization per tenant (id 1/1). We resolve the
   * tenant's first organization here so the token still carries a real
   * organizationId without hardcoding it.
   */
  async findDefaultOrganizationId(tenantId: number): Promise<number> {
    const org = await this.prisma.organization.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true }
    });
    return org?.id ?? tenantId;
  }

  // --- User lookups (scoped by tenantId) ----------------------------------

  findActiveUserByEmail(tenantId: number, email: string) {
    return this.prisma.user.findFirst({
      where: { tenantId, email, isActive: true, deletedAt: null },
      include: userWithRoleInclude
    });
  }

  findActiveUserById(tenantId: number, id: number) {
    return this.prisma.user.findFirst({
      where: { id, tenantId, isActive: true, deletedAt: null },
      include: userWithRoleInclude
    });
  }

  /**
   * Used only during refresh-token rotation, where the userId already came
   * from a cryptographically-verified refresh token, so the tenant is derived
   * from the user record rather than supplied by the caller.
   */
  findActiveUserByIdAnyTenant(id: number) {
    return this.prisma.user.findFirst({
      where: { id, isActive: true, deletedAt: null },
      include: userWithRoleInclude
    });
  }

  touchLastLogin(userId: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  }

  createRefreshToken(data: {
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  findValidRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
    });
  }

  revokeRefreshTokenById(id: number) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  revokeRefreshTokenByHash(tokenHash: string) {
    return this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  revokeAllTokensForUser(userId: number) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
}
