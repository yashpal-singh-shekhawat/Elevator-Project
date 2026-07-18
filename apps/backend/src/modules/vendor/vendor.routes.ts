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

const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().max(500).optional(),
  bisIsiApproved: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
});

const updateVendorSchema = createVendorSchema.partial();

const listVendorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

const createPOSchema = z.object({
  vendorId: z.number().int().positive(),
  expectedDelivery: z.string().optional(),
  bisIsiCertFlag: z.boolean().default(false),
  totalAmount: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  lineItems: z.array(z.object({
    partNumber: z.string().min(1).max(50),
    partName: z.string().min(1).max(200),
    quantityRequested: z.number().int().positive(),
  })).min(1).optional(),
});

const grnSchema = z.object({
  receivedItems: z.array(z.object({
    partNumber: z.string().min(1).max(50),
    partName: z.string().min(1).max(200),
    quantityReceived: z.number().int().positive(),
  })).min(1),
});

const listPOQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  vendorId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Repositories ─────────────────────────────────────────────────────────────

class VendorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findMany(tenant: TenantContext, where: Prisma.VendorWhereInput, listArgs: any) {
    return this.prisma.vendor.findMany({ where: { tenantId: tenant.tenantId, isActive: true, ...where }, ...listArgs });
  }
  count(tenant: TenantContext, where: Prisma.VendorWhereInput) {
    return this.prisma.vendor.count({ where: { tenantId: tenant.tenantId, isActive: true, ...where } });
  }
  findById(tenant: TenantContext, id: number) {
    return this.prisma.vendor.findFirst({ where: { id, tenantId: tenant.tenantId } });
  }
  create(tenant: TenantContext, data: any) {
    return this.prisma.vendor.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId, vendorCode: `VEN-${Date.now()}` },
    });
  }
  update(id: number, data: Prisma.VendorUpdateInput) {
    return this.prisma.vendor.update({ where: { id }, data });
  }
}

class VendorPORepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      vendor: { select: { id: true, name: true } },
      status: { select: { id: true, code: true, label: true, color: true } },
      raisedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.VendorPurchaseOrderWhereInput, listArgs: any) {
    return this.prisma.vendorPurchaseOrder.findMany({ where: { tenantId: tenant.tenantId, ...where }, include: this.include, ...listArgs });
  }
  count(tenant: TenantContext, where: Prisma.VendorPurchaseOrderWhereInput) {
    return this.prisma.vendorPurchaseOrder.count({ where: { tenantId: tenant.tenantId, ...where } });
  }
  findById(tenant: TenantContext, id: number) {
    return this.prisma.vendorPurchaseOrder.findFirst({ where: { id, tenantId: tenant.tenantId }, include: this.include });
  }
  create(tenant: TenantContext, data: any) {
    return this.prisma.vendorPurchaseOrder.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId, poCode: `PO-${Date.now()}` },
      include: this.include,
    });
  }
  update(id: number, data: Prisma.VendorPurchaseOrderUpdateInput) {
    return this.prisma.vendorPurchaseOrder.update({ where: { id }, data, include: this.include });
  }
}

// ─── Services ─────────────────────────────────────────────────────────────────

const VENDOR_SORT = ['id', 'name', 'vendorCode', 'createdAt'] as const;
const VENDOR_SEARCH = ['name', 'vendorCode', 'contactName'] as const;
const PO_SORT = ['id', 'poCode', 'createdAt'] as const;

class VendorService {
  constructor(private readonly repo: VendorRepository) {}

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, VENDOR_SORT, 'name');
    const where = buildSearchWhere(query.search, VENDOR_SEARCH) ?? {};
    const [items, totalItems] = await Promise.all([this.repo.findMany(tenant, where, listArgs), this.repo.count(tenant, where)]);
    return { items, totalItems };
  }
  async getById(tenant: TenantContext, id: number) {
    const v = await this.repo.findById(tenant, id);
    if (!v) throw new NotFoundError('Vendor');
    return v;
  }
  create(tenant: TenantContext, data: any) { return this.repo.create(tenant, data); }
  async update(tenant: TenantContext, id: number, data: any) {
    await this.getById(tenant, id);
    return this.repo.update(id, data);
  }
  async deactivate(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    return this.repo.update(id, { isActive: false });
  }
}

class VendorPOService {
  constructor(private readonly repo: VendorPORepository, private readonly prisma: PrismaClient) {}

  private async getStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({ where: { tenantId, entityType: 'VENDOR_PO', code } });
  }

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, PO_SORT, 'createdAt');
    const where: Prisma.VendorPurchaseOrderWhereInput = {
      ...(query.vendorId ? { vendorId: query.vendorId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
    };
    const [items, totalItems] = await Promise.all([this.repo.findMany(tenant, where, listArgs), this.repo.count(tenant, where)]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const po = await this.repo.findById(tenant, id);
    if (!po) throw new NotFoundError('VendorPurchaseOrder');
    return po;
  }

  async create(tenant: TenantContext, input: any, raisedById: number) {
    const status = await this.getStatus(tenant.tenantId, 'DRAFT');
    return this.repo.create(tenant, { ...input, statusId: status?.id, raisedById, lineItems: undefined });
  }

  async send(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SENT');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async grn(tenant: TenantContext, id: number, receivedItems: Array<{ partNumber: string; partName: string; quantityReceived: number }>, receivedById: number) {
    await this.getById(tenant, id);
    // Add received quantities to inventory
    for (const item of receivedItems) {
      const existing = await this.prisma.inventoryStock.findFirst({
        where: { tenantId: tenant.tenantId, partNumber: item.partNumber },
      });
      if (existing) {
        await this.prisma.inventoryStock.update({
          where: { id: existing.id },
          data: { quantityOnHand: { increment: item.quantityReceived } },
        });
      } else {
        await this.prisma.inventoryStock.create({
          data: {
            tenantId: tenant.tenantId,
            organizationId: tenant.organizationId,
            partNumber: item.partNumber,
            partName: item.partName,
            quantityOnHand: item.quantityReceived,
          },
        });
      }
    }
    const status = await this.getStatus(tenant.tenantId, 'GOODS_RECEIVED');
    return this.repo.update(id, {
      status: { connect: { id: status?.id } },
      grnReceivedAt: new Date(),
      grnReceivedBy: { connect: { id: receivedById } },
    });
  }
}

// ─── Controllers ──────────────────────────────────────────────────────────────

class VendorController {
  constructor(private readonly service: VendorService) {}
  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });
  create = asyncHandler(async (req: Request, res: Response) => {
    const vendor = await this.service.create(req.tenantContext, req.body);
    await req.audit.log({ entityType: 'VENDOR', entityId: vendor.id, action: 'CREATE' });
    ApiResponse.created(res, vendor);
  });
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const vendor = await this.service.update(req.tenantContext, id, req.body);
    await req.audit.log({ entityType: 'VENDOR', entityId: vendor.id, action: 'UPDATE' });
    ApiResponse.success(res, vendor);
  });
  deactivate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const vendor = await this.service.deactivate(req.tenantContext, id);
    await req.audit.log({ entityType: 'VENDOR', entityId: vendor.id, action: 'DEACTIVATE' });
    ApiResponse.success(res, vendor);
  });
}

class VendorPOController {
  constructor(private readonly service: VendorPOService) {}
  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });
  create = asyncHandler(async (req: Request, res: Response) => {
    const po = await this.service.create(req.tenantContext, req.body, req.user!.id);
    await req.audit.log({ entityType: 'VENDOR_PO', entityId: po.id, action: 'CREATE' });
    ApiResponse.created(res, po);
  });
  send = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const po = await this.service.send(req.tenantContext, id);
    await req.audit.log({ entityType: 'VENDOR_PO', entityId: po.id, action: 'SEND' });
    ApiResponse.success(res, po);
  });
  grn = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const po = await this.service.grn(req.tenantContext, id, req.body.receivedItems, req.user!.id);
    await req.audit.log({ entityType: 'VENDOR_PO', entityId: po.id, action: 'GRN' });
    await req.audit.activity('VENDOR_PO', po.id, `GRN received — inventory updated`);
    ApiResponse.success(res, po);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

container.register('VendorRepository', () => new VendorRepository(prisma));
container.register('VendorService', (c) => new VendorService(c.resolve('VendorRepository')));
container.register('VendorPORepository', () => new VendorPORepository(prisma));
container.register('VendorPOService', (c) => new VendorPOService(c.resolve('VendorPORepository'), prisma));

const vendorCtrl = new VendorController(container.resolve<VendorService>('VendorService'));
const poCtrl = new VendorPOController(container.resolve<VendorPOService>('VendorPOService'));

export const vendorRouter = Router();
vendorRouter.use(authenticate);
vendorRouter.get('/',    requirePermissions(['vendor.view']),   validate(listVendorsQuerySchema, 'query'), vendorCtrl.list);
vendorRouter.get('/:id', requirePermissions(['vendor.view']),   validate(idParamSchema, 'params'),         vendorCtrl.getById);
vendorRouter.post('/',   requirePermissions(['vendor.manage']), validate(createVendorSchema, 'body'),      vendorCtrl.create);
vendorRouter.patch('/:id', requirePermissions(['vendor.manage']), validate(idParamSchema, 'params'), validate(updateVendorSchema, 'body'), vendorCtrl.update);
vendorRouter.post('/:id/deactivate', requirePermissions(['vendor.manage']), validate(idParamSchema, 'params'), vendorCtrl.deactivate);

export const vendorPORouter = Router();
vendorPORouter.use(authenticate);
vendorPORouter.get('/',    requirePermissions(['po.create']), validate(listPOQuerySchema, 'query'), poCtrl.list);
vendorPORouter.get('/:id', requirePermissions(['po.create']), validate(idParamSchema, 'params'),    poCtrl.getById);
vendorPORouter.post('/',   requirePermissions(['po.create']), validate(createPOSchema, 'body'),     poCtrl.create);
vendorPORouter.post('/:id/send', requirePermissions(['po.create']), validate(idParamSchema, 'params'), poCtrl.send);
vendorPORouter.post('/:id/grn',  requirePermissions(['po.grn']),    validate(idParamSchema, 'params'), validate(grnSchema, 'body'), poCtrl.grn);
