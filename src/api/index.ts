import express, { Router } from 'express';
import userRouter from './routers/userRoutes.js';
import authRouter from './routers/authRoutes.js';
import myCitiesRouter from './routers/myCitiesRoutes.js';
import { getCountries } from './controllers/countryController.js';
import { getCities } from './controllers/cityController.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import { refreshToken } from './controllers/authController.js';

const apiRouter = Router();

apiRouter.use(express.json());

apiRouter.use('/users', userRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/my-cities', myCitiesRouter);

apiRouter.post('/refresh-token', refreshToken);

apiRouter.get('/countries', getCountries);
apiRouter.get('/cities', getCities);

apiRouter.use(errorMiddleware);

export default apiRouter;