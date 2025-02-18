import Joi from "joi";

const userIdSchema = Joi.object({
  id: Joi.string().required().length(24).hex(),
});

const userListSchema = Joi.object({
  skip: Joi.number().integer(),
  limit: Joi.number().integer(),
}).and('skip', 'limit');

const userCreateSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(5).required(),
  createdAt: Joi.date(),
});

const userUpdateSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(5).optional(),
  createdAt: Joi.date(),
});

export { userCreateSchema, userIdSchema, userListSchema, userUpdateSchema }