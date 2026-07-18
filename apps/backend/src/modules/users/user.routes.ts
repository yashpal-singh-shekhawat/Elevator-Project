import { Router } from 'express';
import { prisma } from '@config/prisma';
import { container } from '@common/container';
import { authenticate } from '@common/middlewares/auth.middleware';
import { requirePermissions } from '@common/middlewares/authorize.middleware';
import { validate } from '@common/middlewares/validate.middleware';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './user.validation';
import { idParamSchema } from '@common/validation/common.schemas';

container.register('UserRepository', () => new UserRepository(prisma));
container.register('UserService', (c) => new UserService(c.resolve('UserRepository')));

const userController = new UserController(container.resolve<UserService>('UserService'));

export const userRouter = Router();
userRouter.use(authenticate, requirePermissions(['users.manage']));

userRouter.get('/', validate(listUsersQuerySchema, 'query'), userController.list);
userRouter.get('/:id', validate(idParamSchema, 'params'), userController.getById);
userRouter.post('/', validate(createUserSchema, 'body'), userController.create);
userRouter.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema, 'body'), userController.update);
userRouter.delete('/:id', validate(idParamSchema, 'params'), userController.remove);
