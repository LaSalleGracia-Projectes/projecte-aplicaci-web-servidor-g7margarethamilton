import { findOne, findById, findAll, create, update, remove } from './databaseService.js';
import City from '../models/City.js';
import type CityI from '../types/CityI.js';

const getCityService = async (credentials: CityI) => {
    const country = await findOne(City, credentials, {});
    return country;
}

const getCityByIdService = async (id: string) => {
    const city = await findById(City, id, {});
    return city;
}

const getCitiesService = async (pagination: { skip: number, limit: number } = { skip: 0, limit: 0 }) => {
    const cities = await findAll(City, { createdAt: 0 }, pagination);
    return cities;
}

const createCityService = async (city: CityI) => {
    const cityParsed = new City(city);
    const cityCreated = await create(cityParsed);
    return cityCreated;
}

const updateCityService = async (city: CityI) => {
    const cityParsed = new City(city);
    const cityUpdated = await update(City, cityParsed, {});
    console.log('updated', cityUpdated)
    return cityUpdated;
}

const removeCityService =  async (id: string) => {
    const country = await remove(City, id, { password: 0 });
    return country;
}


export { getCityService, getCityByIdService, getCitiesService, createCityService, updateCityService, removeCityService };