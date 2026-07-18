import { Request, Response } from 'express';
import { RoleService } from './role.service';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { CreateRoleInput, SetRolePermissionsInput, UpdateRoleInput } from './role.validation';
import { IdParam } from '@common/validation/common.schemas';

export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  listPermissions = asyncHandler(async (_req: Request, res: Response) => {
    ApiResponse.success(res, await this.roleService.listPermissions());
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    ApiResponse.success(res, await this.roleService.list(req.tenantContext));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.roleService.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const role = await this.roleService.create(req.tenantContext, req.body as CreateRoleInput);
    await req.audit.log({ entityType: 'ROLE', entityId: role.id, action: 'CREATE' });
    await req.audit.activity('ROLE', role.id, `Role ${role.name} created`);
    ApiResponse.created(res, role);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const role = await this.roleService.update(req.tenantContext, id, req.body as UpdateRoleInput);
    await req.audit.log({ entityType: 'ROLE', entityId: role.id, action: 'UPDATE' });
    ApiResponse.success(res, role);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    await this.roleService.remove(req.tenantContext, id);
    await req.audit.log({ entityType: 'ROLE', entityId: id, action: 'DELETE' });
    ApiResponse.noContent(res);
  });

  setPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { permissionCodes } = req.body as SetRolePermissionsInput;
    const role = await this.roleService.setPermissions(req.tenantContext, id, permissionCodes);
    await req.audit.log({ entityType: 'ROLE', entityId: role.id, action: 'UPDATE' });
    await req.audit.activity('ROLE', role.id, `Permissions updated for role ${role.name}`);
    ApiResponse.success(res, role);
  });
}
