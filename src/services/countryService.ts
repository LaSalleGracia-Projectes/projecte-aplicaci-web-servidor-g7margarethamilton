import { findOne, findById, findAll, create, update, remove } from './databaseService.js';
import Country from '../models/Country.js';
import type CountryI from '../types/CountryI.js';

const getCountryService = async (credentials: CountryI) => {
  const country = await findOne(Country, credentials, {});
  return country;
}

const getCountryByIdService = async (id: string) => {
  const country = await findById(Country, id, {});
  return country;
}

const getCountriesService = async (pagination: { skip: number, limit: number } = { skip: 0, limit: 0 }) => {
  const countries = await findAll(Country, { createdAt: 0 }, pagination);
  return countries;
}

const createCountryService = async (country: CountryI) => {
  const countryParsed = new Country(country);
  const countryCreated = await create(countryParsed);
  return countryCreated;
}

const updateCountryService = async (country: CountryI) => {
  const countryParsed = new Country(country);
  const countryUpdated = await update(Country, countryParsed, {});
  console.log('updated', countryUpdated)
  return countryUpdated;
}

const removeCountryService =  async (id: string) => {
  const country = await remove(Country, id, { password: 0 });
  return country;
}


export { getCountryService, getCountryByIdService, getCountriesService, createCountryService, updateCountryService, removeCountryService };