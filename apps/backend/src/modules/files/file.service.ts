import { v4 as uuidv4 } from 'uuid';
import { FileRepository } from './file.repository';
import { InstallationProjectRepository } from '@modules/installation-project/installation-project.repository';
import { InstallationMilestoneRepository } from '@modules/installation-milestone/installation-milestone.repository';
import { AmcVisitRepository } from '@modules/amc-visit/amc-visit.repository';
import { generatePresignedDownloadUrl, generatePresignedUploadUrl, deleteObject } from '@config/s3';
import { TenantContext, AuthenticatedUser } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs } from '@common/utils/pagination';
import { BadRequestError, ForbiddenError, NotFoundError } from '@common/errors';
import { ConfirmUploadInput, FILE_MANAGE_PERMISSION, ListFilesQuery, PresignUploadInput } from './file.validation';

const SORT_FIELDS = ['fileName', 'createdAt'] as const;

export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly installationProjectRepository: InstallationProjectRepository,
    private readonly installationMilestoneRepository: InstallationMilestoneRepository,
    private readonly amcVisitRepository: AmcVisitRepository
  ) {}

  async list(tenant: TenantContext, query: ListFilesQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const [rows, totalItems] = await Promise.all([
      this.fileRepository.findMany(tenant, query.entityType, query.entityId, listArgs),
      this.fileRepository.count(tenant, query.entityType, query.entityId)
    ]);

    // Presigned GET URLs are generated on demand, never stored — cheap (no
    // extra AWS cost beyond the signing itself, which is a local computation,
    // not an API call) and avoids ever exposing a long-lived public link.
    const items = await Promise.all(
      rows.map(async (row) => ({ ...row, url: await generatePresignedDownloadUrl(row.fileKey) }))
    );

    return { items, totalItems };
  }

  async presignUpload(tenant: TenantContext, input: PresignUploadInput) {
    await this.assertParentEntityExists(tenant, input.entityType, input.entityId);

    const fileKey = `${tenant.tenantId}/${input.entityType}/${input.entityId}/${uuidv4()}-${sanitizeFileName(input.fileName)}`;
    const { uploadUrl, expiresInSeconds } = await generatePresignedUploadUrl(fileKey, input.mimeType);

    return { fileKey, uploadUrl, expiresInSeconds };
  }

  async confirmUpload(tenant: TenantContext, user: AuthenticatedUser, input: ConfirmUploadInput) {
    await this.assertParentEntityExists(tenant, input.entityType, input.entityId);
    return this.fileRepository.create(tenant, { ...input, uploadedById: user.id });
  }

  async remove(tenant: TenantContext, id: number, user: AuthenticatedUser): Promise<void> {
    const file = await this.fileRepository.findById(tenant, id);
    if (!file) throw new NotFoundError('File');

    const required = FILE_MANAGE_PERMISSION[file.entityType as keyof typeof FILE_MANAGE_PERMISSION];
    if (!required || !user.permissions.includes(required)) {
      throw new ForbiddenError(`Missing required permission: ${required ?? `unknown for entityType "${file.entityType}"`}`);
    }

    await deleteObject(file.fileKey);
    await this.fileRepository.delete(id);
  }

  private async assertParentEntityExists(tenant: TenantContext, entityType: string, entityId: number): Promise<void> {
    switch (entityType) {
      case 'INSTALLATION_PROJECT': {
        const project = await this.installationProjectRepository.findById(tenant, entityId);
        if (!project) throw new BadRequestError('Invalid entityId: no matching installation project for this tenant');
        return;
      }
      case 'INSTALLATION_MILESTONE': {
        const milestone = await this.installationMilestoneRepository.findById(tenant, entityId);
        if (!milestone) throw new BadRequestError('Invalid entityId: no matching installation milestone for this tenant');
        return;
      }
      case 'AMC_VISIT': {
        const exists = await this.amcVisitRepository.exists(tenant, entityId);
        if (!exists) throw new BadRequestError('Invalid entityId: no matching AMC visit for this tenant');
        return;
      }
      default:
        throw new BadRequestError(`Unsupported file entityType "${entityType}"`);
    }
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}
