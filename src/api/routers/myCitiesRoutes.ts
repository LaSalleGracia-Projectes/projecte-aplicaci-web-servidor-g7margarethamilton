import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { addCityToUser, getUserCities, removeCityFromUser } from '../controllers/myCitiesController.js';

const myCitiesRouter = Router();

// Ruta per afegir una ciutat a les meves ciutats
myCitiesRouter.post('/', authMiddleware, addCityToUser);

// Ruta per obtenir les meves ciutats
myCitiesRouter.get('/:userId', authMiddleware, getUserCities);

myCitiesRouter.delete('/', authMiddleware, removeCityFromUser);

export default myCitiesRouter;
