import express, { Application, Request, Response } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { requestIdMiddleware } from '@common/middlewares/request-id.middleware';
import { tenantContextMiddleware } from '@common/middlewares/tenant.middleware';
import { tenantResolver } from '@common/middlewares/tenant-resolver.middleware';
import { auditMiddleware } from '@common/middlewares/audit.middleware';
import { notFoundHandler, globalErrorHandler } from '@common/middlewares/error.middleware';
import { ApiResponse } from '@common/responses/api-response';
import { authRouter } from '@modules/auth/auth.routes';
import { userRouter } from '@modules/users/user.routes';
import { roleRouter } from '@modules/roles/role.routes';
import { masterDataRouter } from '@modules/master-data/master-data.routes';
import { customerRouter } from '@modules/customers/customer.routes';
import { siteRouter } from '@modules/sites/site.routes';
import { liftRouter } from '@modules/lifts/lift.routes';
import { installationProjectRouter } from '@modules/installation-project/installation-project.routes';
import { installationTaskRouter } from '@modules/installation-task/installation-task.routes';
import { installationMilestoneRouter } from '@modules/installation-milestone/installation-milestone.routes';
import { amcContractRouter } from '@modules/amc-contract/amc-contract.routes';
import { amcScheduleRouter } from '@modules/amc-schedule/amc-schedule.routes';
import { amcVisitRouter } from '@modules/amc-visit/amc-visit.routes';
import { checklistRouter } from '@modules/checklist/checklist.routes';
import { fileRouter } from '@modules/files/file.routes';
import { leadRouter } from '@modules/lead/lead.routes';
import { quotationRouter } from '@modules/quotation/quotation.routes';
import { workflowTransitionRouter } from '@modules/workflow-transition/workflow-transition.routes';
import { checklistTemplateRouter } from '@modules/checklist-template/checklist-template.routes';
import { paymentRouter } from '@modules/payment/payment.routes';

import { siteSurveyRouter } from '@modules/site-survey/site-survey.routes';
import { gadDesignRouter } from '@modules/gad-design/gad-design.routes';
import { manufacturingOrderRouter } from '@modules/manufacturing-order/manufacturing-order.routes';
import { dispatchRouter } from '@modules/dispatch/dispatch.routes';
import { installationProjectExtRouter } from '@modules/installation-project/installation-project-ext.routes';
import { serviceTicketRouter } from '@modules/service-ticket/service-ticket.routes';
import { materialRequestRouter } from '@modules/material-request/material-request.routes';
import { inventoryRouter } from '@modules/inventory/inventory.routes';
import { vendorRouter, vendorPORouter } from '@modules/vendor/vendor.routes';
import { invoiceRouter } from '@modules/invoice/invoice.routes';
import { breakdownEscalationRouter } from '@modules/breakdown-escalation/breakdown-escalation.routes';
import { platformAdminRouter } from '@modules/platform-admin/platform-admin.routes';
// NOTE: Auth middleware (Module 4) and versioned module routers (Module 5+)
// are wired in progressively. Auth middleware, once it exists, must be
// mounted BEFORE tenantContextMiddleware in Phase 2 (JWT-based resolution
// needs req.user populated first) — for now tenant context is static and
// order relative to auth doesn't matter yet.

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    morgan('combined', {
      stream: { write: (message: string) => logger.http(message.trim()) }
    })
  );

  // --- Core infra middleware (Module 3) ---
  app.use(requestIdMiddleware);
  app.use(tenantContextMiddleware);
  // Reads the untrusted x-tenant-code header (the tenant the URL claims) so the
  // per-router enforceTenantMatch guard can reject cross-tenant access. Data
  // scoping itself comes from the JWT (see auth.middleware), never this header.
  app.use(tenantResolver);
  app.use(auditMiddleware);

  app.get('/health', (_req: Request, res: Response) => {
    ApiResponse.success(res, {
      status: 'ok',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Publicly served uploaded assets (tenant logos, MVP local storage). Set an
  // explicit cross-origin resource policy so the frontend origin can load the
  // images despite helmet's default CORP lockdown.
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), 'uploads'), {
      setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    })
  );

  // --- API routes ---
  // Platform (super-admin) API — mounted first, fully isolated from tenant
  // routes. Uses its own JWT scope + cookie; never touches tenant context.
  app.use(`${env.API_PREFIX}/platform-admin`, platformAdminRouter);
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/users`, userRouter);
  app.use(`${env.API_PREFIX}/roles`, roleRouter);
  app.use(`${env.API_PREFIX}/master-data`, masterDataRouter);
  app.use(`${env.API_PREFIX}/customers`, customerRouter);
  app.use(`${env.API_PREFIX}/sites`, siteRouter);
  app.use(`${env.API_PREFIX}/lifts`, liftRouter);
  app.use(`${env.API_PREFIX}/installation-projects`, installationProjectRouter);
  app.use(`${env.API_PREFIX}/installation-tasks`, installationTaskRouter);
  app.use(`${env.API_PREFIX}/installation-milestones`, installationMilestoneRouter);
  app.use(`${env.API_PREFIX}/amc-contracts`, amcContractRouter);
  app.use(`${env.API_PREFIX}/amc-schedules`, amcScheduleRouter);
  app.use(`${env.API_PREFIX}/amc-visits`, amcVisitRouter);
  app.use(`${env.API_PREFIX}/checklist-items`, checklistRouter);
  app.use(`${env.API_PREFIX}/files`, fileRouter);
  app.use('/api/v1/leads', leadRouter);
  app.use('/api/v1/quotations', quotationRouter);
  app.use('/api/v1/workflow-transitions', workflowTransitionRouter);
  app.use('/api/v1/checklist-templates', checklistTemplateRouter);
  app.use('/api/v1/payments', paymentRouter);

  app.use('/api/v1/site-surveys', siteSurveyRouter);
  app.use('/api/v1/gad-designs', gadDesignRouter);
  app.use('/api/v1/manufacturing-orders', manufacturingOrderRouter);
  app.use('/api/v1/dispatches', dispatchRouter);
  app.use('/api/v1/installation-projects', installationProjectExtRouter);

  app.use('/api/v1/service-tickets', serviceTicketRouter);
  app.use('/api/v1/material-requests', materialRequestRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/vendors', vendorRouter);
  app.use('/api/v1/vendor-purchase-orders', vendorPORouter);
  app.use('/api/v1/invoices', invoiceRouter);
  app.use('/api/v1/breakdown-escalations', breakdownEscalationRouter);

  // --- 404 + global error handler (must be mounted LAST) ---
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
