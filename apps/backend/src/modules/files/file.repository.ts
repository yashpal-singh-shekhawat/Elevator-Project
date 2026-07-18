import { PrismaClient } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class FileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, entityType: string, entityId: number, listArgs: PrismaListArgs) {
    return this.prisma.fileAsset.findMany({
      where: { tenantId: tenant.tenantId, entityType, entityId },
      ...listArgs
    });
  }

  count(tenant: TenantContext, entityType: string, entityId: number) {
    return this.prisma.fileAsset.count({ where: { tenantId: tenant.tenantId, entityType, entityId } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.fileAsset.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }

  create(
    tenant: TenantContext,
    data: { entityType: string; entityId: number; fileKey: string; fileName: string; mimeType: string; sizeBytes: number; uploadedById?: number }
  ) {
    return this.prisma.fileAsset.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId }
    });
  }

  delete(id: number) {
    return this.prisma.fileAsset.delete({ where: { id } });
  }
}
