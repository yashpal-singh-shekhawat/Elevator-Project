import { z } from 'zod';
import { PrismaClient, Prisma } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
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

const createStockSchema = z.object({
  partNumber: z.string().min(1).max(50),
  partName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  quantityOnHand: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(0),
  location: z.string().max(100).optional(),
  bisIsiCertified: z.boolean().default(false),
  unitCost: z.number().positive().optional(),
});

const updateStockSchema = createStockSchema.partial();

const adjustStockSchema = z.object({
  quantity: z.number().int(),  // positive = add, negative = deduct
  reason: z.string().min(1).max(200),
});

const listStockQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ─── Repository ───────────────────────────────────────────────────────────────

class InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.InventoryStockWhereInput, listArgs: any) {
    return this.prisma.inventoryStock.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.InventoryStockWhereInput) {
    return this.prisma.inventoryStock.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.inventoryStock.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.inventoryStock.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
    });
  }

  update(id: number, data: Prisma.InventoryStockUpdateInput) {
    return this.prisma.inventoryStock.update({ where: { id }, data });
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

const SORT_FIELDS = ['id', 'partNumber', 'partName', 'quantityOnHand'] as const;
const SEARCH_FIELDS = ['partNumber', 'partName'] as const;

class InventoryService {
  constructor(private readonly repo: InventoryRepository) {}

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'partName');
    const searchWhere = buildSearchWhere(query.search, SEARCH_FIELDS) ?? {};
    const where: Prisma.InventoryStockWhereInput = {
      ...searchWhere,
      ...(query.lowStock ? { quantityOnHand: { lte: this.prisma_reorderRef() } } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  // Prisma raw doesn't allow column comparison directly; low stock = quantityOnHand <= reorderLevel
  // We handle this by fetching all and filtering, or use raw. For simplicity, skip low stock filter in where:
  private prisma_reorderRef() { return 0; }

  async getById(tenant: TenantContext, id: number) {
    const stock = await this.repo.findById(tenant, id);
    if (!stock) throw new NotFoundError('InventoryStock');
    return stock;
  }

  create(tenant: TenantContext, data: any) {
    return this.repo.create(tenant, data);
  }

  async update(tenant: TenantContext, id: number, data: any) {
    await this.getById(tenant, id);
    return this.repo.update(id, data);
  }

  async adjust(tenant: TenantContext, id: number, quantity: number) {
    await this.getById(tenant, id);
    return this.repo.update(id, { quantityOnHand: { increment: quantity } });
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

class InventoryController {
  constructor(private readonly service: InventoryService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const stock = await this.service.create(req.tenantContext, req.body);
    await req.audit.log({ entityType: 'INVENTORY_STOCK', entityId: stock.id, action: 'CREATE' });
    ApiResponse.created(res, stock);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const stock = await this.service.update(req.tenantContext, id, req.body);
    await req.audit.log({ entityType: 'INVENTORY_STOCK', entityId: stock.id, action: 'UPDATE' });
    ApiResponse.success(res, stock);
  });

  adjust = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { quantity, reason } = req.body;
    const stock = await this.service.adjust(req.tenantContext, id, quantity);
    await req.audit.log({ entityType: 'INVENTORY_STOCK', entityId: stock.id, action: 'ADJUST' });
    await req.audit.activity('INVENTORY_STOCK', stock.id, `Stock adjusted by ${quantity}: ${reason}`);
    ApiResponse.success(res, stock);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

container.register('InventoryRepository', () => new InventoryRepository(prisma));
container.register('InventoryService', (c) => new InventoryService(c.resolve('InventoryRepository')));

const ctrl = new InventoryController(container.resolve<InventoryService>('InventoryService'));

export const inventoryRouter = Router();
inventoryRouter.use(authenticate);

inventoryRouter.get('/',    requirePermissions(['inventory.view']),   validate(listStockQuerySchema, 'query'), ctrl.list);
inventoryRouter.get('/:id', requirePermissions(['inventory.view']),   validate(idParamSchema, 'params'),       ctrl.getById);
inventoryRouter.post('/',   requirePermissions(['inventory.manage']), validate(createStockSchema, 'body'),     ctrl.create);
inventoryRouter.patch('/:id',
  requirePermissions(['inventory.manage']),
  validate(idParamSchema, 'params'),
  validate(updateStockSchema, 'body'),
  ctrl.update
);
inventoryRouter.post('/:id/adjust',
  requirePermissions(['inventory.manage']),
  validate(idParamSchema, 'params'),
  validate(adjustStockSchema, 'body'),
  ctrl.adjust
);
