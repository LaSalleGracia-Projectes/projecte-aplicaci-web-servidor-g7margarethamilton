import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import validate from '../middlewares/joiValidation.js';
import { userCreateSchema } from '../models/Joi/userSchemas.js';
import { loginSchema } from '../models/Joi/authSchemas.js';

const authRouter = Router();

authRouter.post('/signup',
  validate(userCreateSchema, 'body'),
  register
);

authRouter.post('/login',
  validate(loginSchema, 'body'),
  login
);

export default authRouter; 