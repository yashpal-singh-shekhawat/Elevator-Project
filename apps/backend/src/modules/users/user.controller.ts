import { Request, Response } from 'express';
import { UserService } from './user.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from './user.validation';
import { IdParam } from '@common/validation/common.schemas';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    await respondWithList(res, query, () => this.userService.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.userService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.userService.create(req.tenantContext, req.body as CreateUserInput);
    await req.audit.log({ entityType: 'USER', entityId: user.id, action: 'CREATE' });
    await req.audit.activity('USER', user.id, `User ${user.firstName} ${user.lastName} created`);
    ApiResponse.created(res, user);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const user = await this.userService.update(req.tenantContext, id, req.body as UpdateUserInput);
    await req.audit.log({ entityType: 'USER', entityId: user.id, action: 'UPDATE' });
    ApiResponse.success(res, user);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.userService.softDelete(req.tenantContext, id);
    await req.audit.log({ entityType: 'USER', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });
}
