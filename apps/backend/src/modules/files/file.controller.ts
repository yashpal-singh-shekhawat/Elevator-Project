import { Request, Response } from 'express';
import { FileService } from './file.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { ConfirmUploadInput, ListFilesQuery, PresignUploadInput } from './file.validation';
import { IdParam } from '@common/validation/common.schemas';

export class FileController {
  constructor(private readonly fileService: FileService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListFilesQuery;
    await respondWithList(res, query, () => this.fileService.list(req.tenantContext, query));
  });

  presign = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.fileService.presignUpload(req.tenantContext, req.body as PresignUploadInput);
    ApiResponse.success(res, result);
  });

  confirm = asyncHandler(async (req: Request, res: Response) => {
    const file = await this.fileService.confirmUpload(req.tenantContext, req.user!, req.body as ConfirmUploadInput);
    await req.audit.log({ entityType: 'FILE_ASSET', entityId: file.id, action: 'CREATE' });
    ApiResponse.created(res, file);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.fileService.remove(req.tenantContext, id, req.user!);
    await req.audit.log({ entityType: 'FILE_ASSET', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
