import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { FileRepository } from './file.repository';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { requireFilePermission } from './file-permission.middleware';
import { InstallationProjectRepository } from '@modules/installation-project/installation-project.repository';
import { InstallationMilestoneRepository } from '@modules/installation-milestone/installation-milestone.repository';
import { AmcVisitRepository } from '@modules/amc-visit/amc-visit.repository';
import { confirmUploadSchema, listFilesQuerySchema, presignUploadSchema } from './file.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('FileRepository', () => new FileRepository(prisma));
container.register(
  'FileService',
  (c) =>
    new FileService(
      c.resolve('FileRepository'),
      c.resolve<InstallationProjectRepository>('InstallationProjectRepository'),
      c.resolve<InstallationMilestoneRepository>('InstallationMilestoneRepository'),
      c.resolve<AmcVisitRepository>('AmcVisitRepository')
    )
);

const fileController = new FileController(container.resolve<FileService>('FileService'));

// Two-step upload, both client-driven, server never touches file bytes:
//   1. POST /presign-upload -> client PUTs the file directly to the returned S3 URL
//   2. POST /confirm-upload -> client tells us it's done, we write the FileAsset row
// remove() checks permission by entityType after fetching the row (id-only client input),
// same reasoning as checklist.service.ts's assertManagePermission.
export const fileRouter = Router();
fileRouter.use(authenticate);

fileRouter.get('/', validate(listFilesQuerySchema, 'query'), requireFilePermission('query', 'view'), fileController.list);
fileRouter.post(
  '/presign-upload',
  validate(presignUploadSchema, 'body'),
  requireFilePermission('body', 'manage'),
  fileController.presign
);
fileRouter.post(
  '/confirm-upload',
  validate(confirmUploadSchema, 'body'),
  requireFilePermission('body', 'manage'),
  fileController.confirm
);
fileRouter.delete('/:id', validate(idParamSchema, 'params'), fileController.remove);
