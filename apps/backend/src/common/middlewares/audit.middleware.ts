import { NextFunction, Request, Response } from 'express';
import { prisma } from '@config/prisma';
import { logger } from '@config/logger';

// Common lifecycle actions are suggested for editor autocomplete, but any
// domain-specific action label (e.g. 'ASSIGN', 'APPROVE', 'SEND') is allowed.
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | (string & {});

export interface FieldChange {
  before: unknown;
  after: unknown;
}

export interface RecordAuditParams {
  entityType: string;
  entityId: number;
  action: AuditAction;
  changes?: Record<string, FieldChange>;
}

export interface AuditLogger {
  /** Structured, compliance-grade record of what changed. */
  log(params: RecordAuditParams): Promise<void>;
  /** Human-readable timeline entry, e.g. "Assigned task to Priya Sharma". */
  activity(entityType: string, entityId: number, message: string): Promise<void>;
}

/**
 * Attaches `req.audit` — a small helper bound to the current request's tenant,
 * user, and network metadata — so downstream services can write audit trail
 * entries without re-deriving context each time:
 *
 *   await req.audit.log({ entityType: 'AMC_CONTRACT', entityId: contract.id, action: 'CREATE' });
 *   await req.audit.activity('AMC_CONTRACT', contract.id, `Contract ${contract.contractNumber} created`);
 *
 * Failures to write audit/activity rows are logged but never fail the
 * request — audit logging is best-effort observability, not a transaction
 * participant, so a logging outage can't take down the API.
 */
export function auditMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const { tenantContext, requestId, user } = req;
  const ipAddress = req.ip;
  const userAgent = req.header('user-agent');

  req.audit = {
    async log(params: RecordAuditParams): Promise<void> {
      try {
        await prisma.auditLog.create({
          data: {
            tenantId: tenantContext.tenantId,
            organizationId: tenantContext.organizationId,
            userId: user?.id,
            entityType: params.entityType,
            entityId: params.entityId,
            action: params.action,
            changes: params.changes as never,
            ipAddress,
            userAgent
          }
        });
      } catch (err) {
        logger.error(`[audit] failed to write audit log (requestId=${requestId})`, err);
      }
    },

    async activity(entityType: string, entityId: number, message: string): Promise<void> {
      try {
        await prisma.activityLog.create({
          data: {
            tenantId: tenantContext.tenantId,
            entityType,
            entityId,
            userId: user?.id,
            message
          }
        });
      } catch (err) {
        logger.error(`[audit] failed to write activity log (requestId=${requestId})`, err);
      }
    }
  };

  next();
}
