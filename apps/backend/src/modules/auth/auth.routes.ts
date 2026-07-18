import { Router } from 'express';
import { prisma } from '@config/prisma';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { validate } from '@common/middlewares/validate.middleware';
import { authenticate } from '@common/middlewares/auth.middleware';
import { loginSchema } from './auth.validation';

// Manual composition root for this module — registered with the shared
// container so other modules could resolve AuthService if ever needed
// (e.g. a future "change password" flow in the users module).
import { container } from '@common/container';

container.register('AuthRepository', () => new AuthRepository(prisma));
container.register('AuthService', (c) => new AuthService(c.resolve('AuthRepository')));

const authService = container.resolve<AuthService>('AuthService');
const authController = new AuthController(authService);

export const authRouter = Router();

// Public tenant branding (name + logo) for the login screen — no auth.
authRouter.get('/:companyCode/branding', authController.branding);

// URL-based tenant login: POST /api/v1/auth/:companyCode/login
// The frontend hits this from /:companyCode/login. Tenant is resolved from
// the slug in the path — only that tenant's users are searched.
authRouter.post('/:companyCode/login', validate(loginSchema, 'body'), authController.login);

// Backward-compatible login: tenant code supplied in the body instead.
authRouter.post('/login', validate(loginSchema, 'body'), authController.login);

authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
