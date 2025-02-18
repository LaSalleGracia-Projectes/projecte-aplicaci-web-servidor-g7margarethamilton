import { findOne, findById, findAll, create, update, remove } from './databaseService.js';
import User from '../models/User.js';
import type UserI from '../types/UserI.js';

const getUserService = async (credentials: UserI) => {
  const user = await findOne(User, credentials, {});
  return user;
}

const getUserByIdService = async (id: string) => {
  const user = await findById(User, id, {});
  return user;
}

const getUsersService = async (pagination: { skip: number, limit: number } = { skip: 0, limit: 0 }) => {
  const users = await findAll(User, { createdAt: 0 }, pagination);
  return users;
}

const createUserService = async (user: UserI) => {
  const userParsed = new User(user);
  const userCreated = await create(userParsed);
  return userCreated;
}

const updateUserService = async (user: UserI) => {
  const userParsed = new User(user);
  userParsed.createdAt = undefined;
  const userUpdated = await update(User, userParsed, {});
  console.log('updated', userUpdated)
  return userUpdated;
}

const removeUserService =  async (id: string) => {
  const user = await remove(User, id, { password: 0 });
  return user;
}

const updateUserCitiesService = async (userId: string, cityId: string) => {
  const user = await findById(User, userId, {});
  if (user) {
    user.myCitiesId.push(cityId);
    const userUpdated = await update(User, user, {});
    return userUpdated;
  }

  return null;
}

const getUserCitiesService = async (userId: string) => {
  const user = await findById(User, userId, {});
  if (user) {
    return user.myCitiesId;
  }

  return null;
}

const removeCityFromUserService = async (userId: string, cityId: string) => {
  const user = await findById(User, userId, {});
  if (user) {
    user.myCitiesId = user.myCitiesId.filter((id) => id !== cityId);

    const userUpdated = await update(User, user, {});
    return userUpdated;
  }

  return null;
};

export { getUserService, getUserByIdService, getUsersService, createUserService, updateUserService, removeUserService, updateUserCitiesService, getUserCitiesService, removeCityFromUserService };