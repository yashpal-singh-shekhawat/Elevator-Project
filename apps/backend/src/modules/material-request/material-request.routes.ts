import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs } from '@common/utils/pagination';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { idParamSchema, IdParam } from '@common/validation/common.schemas';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { prisma } from '@config/prisma';
import { container } from '@common/container';

// ─── Validation ──────────────────────────────────────────────────────────────

export const createMaterialRequestSchema = z.object({
  serviceTicketId: z.number().int().positive(),
  coverageEligible: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
  lineItems: z.array(z.object({
    partNumber: z.string().min(1).max(50),
    partName: z.string().min(1).max(200),
    quantityRequested: z.number().int().positive(),
  })).min(1),
});

export const raisePOSchema = z.object({
  vendorId: z.number().int().positive(),
});

export const listMaterialRequestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  serviceTicketId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Repository ───────────────────────────────────────────────────────────────

class MaterialRequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      raisedBy: { select: { id: true, firstName: true, lastName: true } },
      lineItems: true,
    };
  }

  findMany(tenant: TenantContext, where: Prisma.MaterialRequestWhereInput, listArgs: any) {
    return this.prisma.materialRequest.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.MaterialRequestWhereInput) {
    return this.prisma.materialRequest.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.materialRequest.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.materialRequest.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.MaterialRequestUpdateInput) {
    return this.prisma.materialRequest.update({ where: { id }, data, include: this.include });
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

const SORT_FIELDS = ['id', 'mrdCode', 'createdAt'] as const;

class MaterialRequestService {
  constructor(private readonly repo: MaterialRequestRepository, private readonly prisma: PrismaClient) {}

  private async getStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({ where: { tenantId, entityType: 'MATERIAL_REQUEST', code } });
  }

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where = query.serviceTicketId ? { serviceTicketId: query.serviceTicketId } : {};
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const mrd = await this.repo.findById(tenant, id);
    if (!mrd) throw new NotFoundError('MaterialRequest');
    return mrd;
  }

  async create(tenant: TenantContext, input: any, raisedById: number) {
    const status = await this.getStatus(tenant.tenantId, 'DRAFT');
    const { lineItems, ...rest } = input;
    const mrd = await this.repo.create(tenant, {
      ...rest,
      mrdCode: `MRD-${Date.now()}`,
      statusId: status?.id,
      raisedById,
    });
    // Create line items
    await this.prisma.materialRequestItem.createMany({
      data: lineItems.map((i: any) => ({ ...i, materialRequestId: mrd.id })),
    });
    return this.repo.findById(tenant, mrd.id);
  }

  async approve(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'APPROVED');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async issueFromStock(tenant: TenantContext, id: number) {
    const mrd = await this.getById(tenant, id);
    // Deduct from inventory for each line item
    for (const item of mrd.lineItems) {
      const stock = await this.prisma.inventoryStock.findFirst({
        where: { tenantId: tenant.tenantId, partNumber: item.partNumber },
      });
      if (stock) {
        await this.prisma.inventoryStock.update({
          where: { id: stock.id },
          data: { quantityOnHand: { decrement: item.quantityRequested } },
        });
        await this.prisma.materialRequestItem.update({
          where: { id: item.id },
          data: { quantityIssued: item.quantityRequested, inventoryStockId: stock.id },
        });
      }
    }
    const status = await this.getStatus(tenant.tenantId, 'IN_STOCK_ISSUED');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async raisePO(tenant: TenantContext, id: number, vendorId: number) {
    await this.getById(tenant, id);
    const poStatus = await this.prisma.status.findFirst({
      where: { tenantId: tenant.tenantId, entityType: 'VENDOR_PO', code: 'DRAFT' },
    });
    const po = await this.prisma.vendorPurchaseOrder.create({
      data: {
        tenantId: tenant.tenantId,
        organizationId: tenant.organizationId,
        poCode: `PO-${Date.now()}`,
        vendorId,
        statusId: poStatus?.id ?? 0,
        raisedById: 0, // will be set in controller
      },
    });
    const status = await this.getStatus(tenant.tenantId, 'PO_RAISED');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async reject(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'REJECTED');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

class MaterialRequestController {
  constructor(private readonly service: MaterialRequestService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const mrd = await this.service.create(req.tenantContext, req.body, req.user!.id);
    await req.audit.log({ entityType: 'MATERIAL_REQUEST', entityId: mrd!.id, action: 'CREATE' });
    ApiResponse.created(res, mrd);
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const mrd = await this.service.approve(req.tenantContext, id);
    await req.audit.log({ entityType: 'MATERIAL_REQUEST', entityId: mrd.id, action: 'APPROVE' });
    ApiResponse.success(res, mrd);
  });

  issueFromStock = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const mrd = await this.service.issueFromStock(req.tenantContext, id);
    await req.audit.log({ entityType: 'MATERIAL_REQUEST', entityId: mrd.id, action: 'ISSUE_FROM_STOCK' });
    ApiResponse.success(res, mrd);
  });

  raisePO = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const mrd = await this.service.raisePO(req.tenantContext, id, req.body.vendorId);
    await req.audit.log({ entityType: 'MATERIAL_REQUEST', entityId: mrd.id, action: 'RAISE_PO' });
    ApiResponse.success(res, mrd);
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const mrd = await this.service.reject(req.tenantContext, id);
    await req.audit.log({ entityType: 'MATERIAL_REQUEST', entityId: mrd.id, action: 'REJECT' });
    ApiResponse.success(res, mrd);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

container.register('MaterialRequestRepository', () => new MaterialRequestRepository(prisma));
container.register('MaterialRequestService', (c) => new MaterialRequestService(c.resolve('MaterialRequestRepository'), prisma));

const ctrl = new MaterialRequestController(container.resolve<MaterialRequestService>('MaterialRequestService'));

export const materialRequestRouter = Router();
materialRequestRouter.use(authenticate);

materialRequestRouter.get('/',    requirePermissions(['material.view']),   validate(listMaterialRequestsQuerySchema, 'query'), ctrl.list);
materialRequestRouter.get('/:id', requirePermissions(['material.view']),   validate(idParamSchema, 'params'),                  ctrl.getById);
materialRequestRouter.post('/',   requirePermissions(['material.create']), validate(createMaterialRequestSchema, 'body'),      ctrl.create);
materialRequestRouter.post('/:id/approve',        requirePermissions(['material.approve']), validate(idParamSchema, 'params'), ctrl.approve);
materialRequestRouter.post('/:id/issue-from-stock', requirePermissions(['material.approve']), validate(idParamSchema, 'params'), ctrl.issueFromStock);
materialRequestRouter.post('/:id/raise-po',       requirePermissions(['material.approve']), validate(idParamSchema, 'params'), validate(raisePOSchema, 'body'), ctrl.raisePO);
materialRequestRouter.post('/:id/reject',         requirePermissions(['material.approve']), validate(idParamSchema, 'params'), ctrl.reject);
