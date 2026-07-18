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

const acknowledgeSchema = z.object({
  resolution: z.enum(['RESOLVED_IN_AMC', 'ROUTED_TO_MODERNIZATION']),
  notes: z.string().min(1).max(1000),
});

const listEscalationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  statusId: z.coerce.number().int().positive().optional(),
  liftId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Repository ───────────────────────────────────────────────────────────────

class BreakdownEscalationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      status: { select: { id: true, code: true, label: true, color: true } },
      lift: { select: { id: true, serialNumber: true } },
      reviewedBy: { select: { id: true, firstName: true, lastName: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.BreakdownEscalationWhereInput, listArgs: any) {
    return this.prisma.breakdownEscalation.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.BreakdownEscalationWhereInput) {
    return this.prisma.breakdownEscalation.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.breakdownEscalation.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.BreakdownEscalationUpdateInput) {
    return this.prisma.breakdownEscalation.update({ where: { id }, data, include: this.include });
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

const SORT_FIELDS = ['id', 'breakdownCount', 'triggeredAt', 'createdAt'] as const;

class BreakdownEscalationService {
  constructor(private readonly repo: BreakdownEscalationRepository, private readonly prisma: PrismaClient) {}

  private async getStatus(tenantId: number, code: string) {
    return this.prisma.status.findFirst({ where: { tenantId, entityType: 'BREAKDOWN_ESCALATION', code } });
  }

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'triggeredAt');
    const where: Prisma.BreakdownEscalationWhereInput = {
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.liftId ? { liftId: query.liftId } : {}),
      closedAt: null, // default: only open escalations
    };
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const esc = await this.repo.findById(tenant, id);
    if (!esc) throw new NotFoundError('BreakdownEscalation');
    return esc;
  }

  async acknowledge(tenant: TenantContext, id: number, resolution: string, notes: string, reviewedById: number) {
    await this.getById(tenant, id);

    const statusCode = resolution === 'ROUTED_TO_MODERNIZATION'
      ? 'ROUTED_TO_MODERNIZATION'
      : 'RESOLVED_IN_AMC';

    const status = await this.getStatus(tenant.tenantId, statusCode);

    return this.repo.update(id, {
      status: { connect: { id: status?.id } },
      reviewedBy: { connect: { id: reviewedById } },
      reviewedAt: new Date(),
      resolution,
      notes,
      closedAt: new Date(),
    });
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

class BreakdownEscalationController {
  constructor(private readonly service: BreakdownEscalationService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    await respondWithList(res, req.query as any, () => this.service.list(req.tenantContext, req.query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  acknowledge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { resolution, notes } = req.body;
    const esc = await this.service.acknowledge(req.tenantContext, id, resolution, notes, req.user!.id);
    await req.audit.log({ entityType: 'BREAKDOWN_ESCALATION', entityId: esc.id, action: 'ACKNOWLEDGE' });
    await req.audit.activity('BREAKDOWN_ESCALATION', esc.id, `Escalation resolved: ${resolution}`);
    ApiResponse.success(res, esc);
  });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

container.register('BreakdownEscalationRepository', () => new BreakdownEscalationRepository(prisma));
container.register('BreakdownEscalationService', (c) => new BreakdownEscalationService(c.resolve('BreakdownEscalationRepository'), prisma));

const ctrl = new BreakdownEscalationController(
  container.resolve<BreakdownEscalationService>('BreakdownEscalationService')
);

export const breakdownEscalationRouter = Router();
breakdownEscalationRouter.use(authenticate);

breakdownEscalationRouter.get('/',    requirePermissions(['escalation.view']),   validate(listEscalationsQuerySchema, 'query'), ctrl.list);
breakdownEscalationRouter.get('/:id', requirePermissions(['escalation.view']),   validate(idParamSchema, 'params'),              ctrl.getById);
breakdownEscalationRouter.post('/:id/acknowledge',
  requirePermissions(['escalation.review']),
  validate(idParamSchema, 'params'),
  validate(acknowledgeSchema, 'body'),
  ctrl.acknowledge
);
