import { type Request, type Response, type NextFunction } from 'express';
import httpStatus from '../config/httpStatusCodes.js';
import { getCountriesService } from '../../services/countryService.js';

const getCountries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pagination = {
            skip: Number(req.query.skip) || 0,
            limit: Number(req.query.limit) || 0,
        };
        const countries = await getCountriesService(pagination);

        // Si no hi ha cap país retornat, enviem una resposta 404
        if (!countries || countries.length === 0) {
            return res.status(httpStatus.notFound).send({ msg: 'Countries not found!' });
        }

        // Filtrar els països per les lletres inicials proporcionades
        const startingLetters = req.query.startingLetters ? String(req.query.startingLetters).toUpperCase() : null;
        let filteredCountries = countries;
        if (startingLetters) {
            filteredCountries = filteredCountries.filter(country => country.name.toUpperCase().startsWith(startingLetters));
        }

        // Si després de filtrar no hi ha cap país, enviem una resposta 404
        if (filteredCountries.length === 0) {
            return res.status(httpStatus.notFound).send({ msg: 'No countries found matching the starting letters!' });
        }

        // Ordenar els països alfabèticament pel nom
        filteredCountries.sort((a, b) => a.name.localeCompare(b.name));

        // Enviar els països filtrats i ordenats
        res.status(httpStatus.ok).send(filteredCountries);
    } catch (error) {
        // Enviar un error si hi ha algun problema en la consulta a la base de dades
        next(error);
    }
}

export { getCountries };
