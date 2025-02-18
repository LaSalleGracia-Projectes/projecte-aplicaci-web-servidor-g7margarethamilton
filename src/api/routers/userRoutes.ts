import { Router } from 'express';
import { getUserById, getUsers, createUser, updateUser, removeUser } from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/joiValidation.js';
import { userCreateSchema, userIdSchema, userListSchema, userUpdateSchema } from '../models/Joi/userSchemas.js';

const userRouter = Router();

userRouter.get('/:id',
  validate(userIdSchema, 'params'),
  getUserById
);
userRouter.get('/',
  authMiddleware,
  validate(userListSchema, 'query'),
  getUsers
);
userRouter.post('/',
  validate(userCreateSchema, 'body'),
  createUser
);
userRouter.put('/:id',
  validate(userIdSchema, 'params'),
  validate(userUpdateSchema, 'body'),
  updateUser
);
userRouter.delete('/:id',
  validate(userIdSchema, 'params'),
  removeUser
);


export default userRouter;