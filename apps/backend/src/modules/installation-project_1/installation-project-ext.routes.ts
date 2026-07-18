import { Router } from 'express';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@config/prisma';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { idParamSchema, IdParam } from '@common/validation/common.schemas';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { NotFoundError } from '@common/errors';

// ─── Validation ──────────────────────────────────────────────────────────────

const transitionSchema = z.object({
  toStatusCode: z.string().min(1),
  remarks: z.string().max(1000).optional(),
});

const assignEngineerSchema = z.object({
  userId: z.number().int().positive(),
});

const signOffSchema = z.object({
  signedByName: z.string().min(1).max(100),
  remarks: z.string().max(1000).optional(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getProject(tenantId: number, id: number) {
  const project = await prisma.installationProject.findFirst({
    where: { id, tenantId },
    include: { status: true },
  });
  if (!project) throw new NotFoundError('InstallationProject');
  return project;
}

async function getStatus(tenantId: number, code: string) {
  return prisma.status.findFirst({
    where: { tenantId, entityType: 'INSTALLATION_PROJECT', code },
  });
}

// ─── Handlers ────────────────────────────────────────────────────────────────

const transition = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam;
  const { toStatusCode, remarks } = req.body;
  const project = await getProject(req.tenantContext.tenantId, id);
  const toStatus = await getStatus(req.tenantContext.tenantId, toStatusCode);
  if (!toStatus) throw new NotFoundError(`Status ${toStatusCode}`);

  // Log workflow transition
  await prisma.workflowTransition.create({
    data: {
      tenantId: req.tenantContext.tenantId,
      organizationId: req.tenantContext.organizationId,
      entityType: 'INSTALLATION_PROJECT',
      entityId: id,
      fromStatusId: project.statusId,
      toStatusId: toStatus.id,
      actionedById: req.user!.id,
      remarks,
    },
  });

  const updated = await prisma.installationProject.update({
    where: { id },
    data: { statusId: toStatus.id },
    include: { status: true },
  });

  await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: id, action: 'STATUS_CHANGE' });
  await req.audit.activity('INSTALLATION_PROJECT', id, `Status → ${toStatus.label}${remarks ? ': ' + remarks : ''}`);
  ApiResponse.success(res, updated);
});

const assignEngineer = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam;
  const { userId } = req.body;
  await getProject(req.tenantContext.tenantId, id);

  const updated = await prisma.installationProject.update({
    where: { id },
    data: { assignedEngineerId: userId },
    include: { status: true },
  });

  await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: id, action: 'ASSIGN' });
  await req.audit.activity('INSTALLATION_PROJECT', id, `Engineer assigned: user #${userId}`);
  ApiResponse.success(res, updated);
});

const signOff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParam;
  const { signedByName, remarks } = req.body;
  const project = await getProject(req.tenantContext.tenantId, id);
  const handedOverStatus = await getStatus(req.tenantContext.tenantId, 'PROJECT_COMPLETED_AND_HANDED_OVER');

  // Log workflow transition
  if (handedOverStatus) {
    await prisma.workflowTransition.create({
      data: {
        tenantId: req.tenantContext.tenantId,
        organizationId: req.tenantContext.organizationId,
        entityType: 'INSTALLATION_PROJECT',
        entityId: id,
        fromStatusId: project.statusId,
        toStatusId: handedOverStatus.id,
        actionedById: req.user!.id,
        remarks: `Signed off by: ${signedByName}${remarks ? ' — ' + remarks : ''}`,
      },
    });
  }

  const updated = await prisma.installationProject.update({
    where: { id },
    data: {
      ...(handedOverStatus ? { statusId: handedOverStatus.id } : {}),
      actualEndDate: new Date(),
    },
    include: { status: true },
  });

  await req.audit.log({ entityType: 'INSTALLATION_PROJECT', entityId: id, action: 'SIGN_OFF' });
  await req.audit.activity('INSTALLATION_PROJECT', id, `Project handed over. Signed by: ${signedByName}`);
  ApiResponse.success(res, updated);
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const installationProjectExtRouter = Router();
installationProjectExtRouter.use(authenticate);

installationProjectExtRouter.post('/:id/transition',
  requirePermissions(['installation.update']),
  validate(idParamSchema, 'params'),
  validate(transitionSchema, 'body'),
  transition
);

installationProjectExtRouter.post('/:id/assign-engineer',
  requirePermissions(['installation.assign']),
  validate(idParamSchema, 'params'),
  validate(assignEngineerSchema, 'body'),
  assignEngineer
);

installationProjectExtRouter.post('/:id/sign-off',
  requirePermissions(['installation.signoff']),
  validate(idParamSchema, 'params'),
  validate(signOffSchema, 'body'),
  signOff
);
