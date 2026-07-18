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

const createInvoiceSchema = z.object({
  entityType: z.enum(['AMC_CONTRACT', 'SERVICE_TICKET']),
  entityId: z.number().int().positive(),
  amcContractId: z.number().int().positive().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
  lineItems: z.array(z.object({
    description: z.string().min(1).max(200),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().positive(),
  })).min(1),
});

const markPaidSchema = z.object({
  paymentId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

const listInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.enum(['AMC_CONTRACT', 'SERVICE_TICKET']).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Repository ───────────────────────────────────────────────────────────────

class InvoiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      issuedBy: { select: { id: true, firstName: true, lastName: true } },
      lineItems: true,
    };
  }

  findMany(tenant: TenantContext, where: Prisma.InvoiceWhereInput, listArgs: any) {
    return this.prisma.invoice.findMany({ where: { tenantId: tenant.tenantId, ...where }, include: this.include, ...listArgs });
  }
  count(tenant: TenantContext, where: Prisma.InvoiceWhereInput) {
    return this.prisma.invoice.count({ where: { tenantId: tenant.tenantId, ...where } });
  }
  findById(tenant: TenantContext, id: number) {
    return this.prisma.invoice.findFirst({ where: { id, tenantId: tenant.tenantId }, include: this.include });
  }
  create(tenant: TenantContext, data: any) {
    return this.prisma.invoice.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId, invoiceCode: `INV-${Date.now()}` },
      include: this.include,
    });
  }
  update(id: number, data: Prisma.InvoiceUpdateInput) {
    return this.prisma.invoice.update({ where: { id }, data, include: this.include });
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

const SORT_FIELDS = ['id', 'invoiceCode', 'totalAmount', 'createdAt'] as const;

class InvoiceService {
  constructor(private readonly repo: InvoiceRepository, private readonly prisma: PrismaClient) {}

  private async getStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({ where: { tenantId, entityType: 'INVOICE', code } });
  }

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.InvoiceWhereInput = {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
    };
    const [items, totalItems] = await Promise.all([this.repo.findMany(tenant, where, listArgs), this.repo.count(tenant, where)]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const inv = await this.repo.findById(tenant, id);
    if (!inv) throw new NotFoundError('Invoice');
    return inv;
  }

  async create(tenant: TenantContext, input: any, issuedById: number) {
    const { lineItems, ...rest } = input;
    const status = await this.getStatus(tenant.tenantId, 'DRAFT');

    // Calculate totals
    const subtotal = lineItems.reduce((sum: number, i: any) => sum + i.quantity * i.unitPrice, 0);
    const taxAmount = 0; // GST can be added later
    const totalAmount = subtotal + taxAmount;

    const invoice = await this.repo.create(tenant, {
      ...rest,
      statusId: status?.id,
      issuedById,
      subtotal,
      taxAmount,
      totalAmount,
    });

    // Create line items
    await this.prisma.invoiceLineItem.createMany({
      data: lineItems.map((i: any) => ({
        invoiceId: invoice.id,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.quantity * i.unitPrice,
      })),
    });

    return this.repo.findById(tenant, invoice.id);
  }

  async send(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SENT');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async markPaid(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'PAID');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

class InvoiceController {
  constructor(private readonly service: InvoiceService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });
  create = asyncHandler(async (req: Request, res: Response) => {
    const invoice = await this.service.create(req.tenantContext, req.body, req.user!.id);
    await req.audit.log({ entityType: 'INVOICE', entityId: invoice!.id, action: 'CREATE' });
    await req.audit.activity('INVOICE', invoice!.id, `Invoice "${invoice!.invoiceCode}" created — ₹${invoice!.totalAmount}`);
    ApiResponse.created(res, invoice);
  });
  send = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const invoice = await this.service.send(req.tenantContext, id);
    await req.audit.log({ entityType: 'INVOICE', entityId: invoice.id, action: 'SEND' });
    ApiResponse.success(res, invoice);
  });
  markPaid = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const invoice = await this.service.markPaid(req.tenantContext, id);
    await req.audit.log({ entityType: 'INVOICE', entityId: invoice.id, action: 'MARK_PAID' });
    await req.audit.activity('INVOICE', invoice.id, `Invoice marked as paid`);
    ApiResponse.success(res, invoice);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

container.register('InvoiceRepository', () => new InvoiceRepository(prisma));
container.register('InvoiceService', (c) => new InvoiceService(c.resolve('InvoiceRepository'), prisma));

const ctrl = new InvoiceController(container.resolve<InvoiceService>('InvoiceService'));

export const invoiceRouter = Router();
invoiceRouter.use(authenticate);

invoiceRouter.get('/',    requirePermissions(['invoice.view']),   validate(listInvoicesQuerySchema, 'query'), ctrl.list);
invoiceRouter.get('/:id', requirePermissions(['invoice.view']),   validate(idParamSchema, 'params'),          ctrl.getById);
invoiceRouter.post('/',   requirePermissions(['invoice.create']), validate(createInvoiceSchema, 'body'),      ctrl.create);
invoiceRouter.post('/:id/send',      requirePermissions(['invoice.manage']), validate(idParamSchema, 'params'), ctrl.send);
invoiceRouter.post('/:id/mark-paid', requirePermissions(['invoice.manage']), validate(idParamSchema, 'params'), validate(markPaidSchema, 'body'), ctrl.markPaid);
