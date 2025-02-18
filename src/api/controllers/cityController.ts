import { type Request, type Response, type NextFunction } from 'express';
import httpStatus from '../config/httpStatusCodes.js';
import { getCitiesService } from '../../services/cityService.js';

const getCities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pagination = {
            skip: Number(req.query.skip) || 0,
            limit: Number(req.query.limit) || 0,
        };

        const cities = await getCitiesService(pagination);

        // Si no hi ha cap ciutat retornada, enviem una resposta 404
        if (!cities || cities.length === 0) {
            return res.status(httpStatus.notFound).send({ msg: 'Cities not found!' });
        }

        // Filtrar les ciutats per lletres inicials si s'han proporcionat
        const startingLetters = req.query.startingLetters ? String(req.query.startingLetters).toLowerCase() : null;
        let filteredCities = cities;
        if (startingLetters) {
            filteredCities = filteredCities.filter(city => city.name.toLowerCase().startsWith(startingLetters));
        }

        // Filtrar les ciutats pel codi de país si s'ha proporcionat
        const countryCode = req.query.countryCode ? String(req.query.countryCode).toUpperCase() : null;
        if (countryCode) {
            filteredCities = filteredCities.filter(city => city.country === countryCode);
        }

        // Si després de filtrar no hi ha cap ciutat, enviem una resposta 404
        if (filteredCities.length === 0) {
            return res.status(httpStatus.notFound).send({ msg: 'No cities found matching the criteria!' });
        }

        // Ordenar les ciutats alfabèticament pel nom
        filteredCities.sort((a, b) => a.name.localeCompare(b.name));

        // Enviar les ciutats filtrades i ordenades
        res.status(httpStatus.ok).send(filteredCities);
    } catch (error) {
        // Enviar un error si hi ha algun problema en la consulta a la base de dades
        next(error);
    }
}

export { getCities };
