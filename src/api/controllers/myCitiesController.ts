import type { Request, Response, NextFunction } from 'express';
import httpStatus from '../config/httpStatusCodes.js';
import { updateUserCitiesService, getUserCitiesService, removeCityFromUserService } from '../../services/userService.js';
import { getCityByIdService } from '../../services/cityService.js';

// Afegeix una ciutat a la llista de ciutats de l'usuari
const addCityToUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Obtenir l'ID de l'usuari del paràmetre o res.locals
        const { userId } = req.body;

        // Verificar que `userId` és vàlid
        if (!userId) {
            return res.status(httpStatus.unauthorized).send({ msg: "User " });
        }

        // Obtenir el `cityId` del cos de la sol·licitud
        const { cityId } = req.body;

        if (!cityId) {
            return res.status(httpStatus.badRequest).send({ msg: 'City ID is missing' });
        }

        // Comprovar si la ciutat existeix
        const city = await getCityByIdService(cityId);
        if (!city) {
            return res.status(httpStatus.notFound).send({ msg: 'City not found!' });
        }

        // Afegir la ciutat a la llista de ciutats de l'usuari
        const userUpdated = await updateUserCitiesService(userId, cityId);

        if (userUpdated) {
            res.status(httpStatus.ok).send({ msg: 'City added successfully!' });
        } else {
            res.status(httpStatus.internalServerError).send({ msg: 'Failed to add city!' });
        }
    } catch (error) {
        next(error);
    }
};

// Obtenir les ciutats de l'usuari
const getUserCities = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(httpStatus.unauthorized).send({ msg: 'Invalid or missing user ID' });
        }

        // Recuperar les ciutats associades a l'usuari
        const cityIds = await getUserCitiesService(userId);

        if (!cityIds || cityIds.length === 0) {
            return res.status(httpStatus.notFound).send({ msg: 'No cities found for this user!' });
        }

        // Obtenir els detalls de les ciutats
        const cityDetails = await Promise.all(
            cityIds.map(async (cityId) => {
                const city = await getCityByIdService(cityId);
                return city; // Retornar la ciutat o `null` si no es troba
            })
        );

        // Filtrar ciutats invàlides
        const validCityDetails = cityDetails.filter(city => city !== null);

        // Ordenar només si tots els elements són vàlids
        const sortedCities = validCityDetails.sort((a, b) => {
            if (!a?.name || !b?.name) {
                return 0; // Evitar errors si falta el nom
            }

            return a.name.localeCompare(b.name); // Comparar pel nom
        });

        res.status(httpStatus.ok).send(sortedCities);
    } catch (error) {
        next(error);
    }
};

// Treure una ciutat de la llista de ciutats de l'usuari
const removeCityFromUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Obtenir l'ID de l'usuari del cos de la sol·licitud
        const { userId, cityId } = req.body;

        if (!userId) {
            return res.status(httpStatus.unauthorized).send({ msg: 'Invalid or missing user ID' });
        }

        if (!cityId) {
            return res.status(httpStatus.badRequest).send({ msg: 'City ID is missing' });
        }

        // Comprovar si la ciutat existeix
        const city = await getCityByIdService(cityId);
        if (!city) {
            return res.status(httpStatus.notFound).send({ msg: 'City not found!' });
        }

        // Treure la ciutat de la llista de ciutats de l'usuari
        const userUpdated = await removeCityFromUserService(userId, cityId);

        if (userUpdated) {
            res.status(httpStatus.ok).send({ msg: 'City removed successfully!' });
        } else {
            res.status(httpStatus.internalServerError).send({ msg: 'Failed to remove city!' });
        }
    } catch (error) {
        next(error);
    }
};

export { addCityToUser, getUserCities, removeCityFromUser };
