import { Router } from 'express';
import { statusRouter } from './status/status.routes';
import { liftTypeRouter } from './lift-type/lift-type.routes';
import { serviceTypeRouter } from './service-type/service-type.routes';

export const masterDataRouter = Router();

masterDataRouter.use('/statuses', statusRouter);
masterDataRouter.use('/lift-types', liftTypeRouter);
masterDataRouter.use('/service-types', serviceTypeRouter);
