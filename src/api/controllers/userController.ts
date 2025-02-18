import { type Request, type Response, type NextFunction } from 'express';
import httpStatus from '../config/httpStatusCodes.js';
import { getUserByIdService, getUsersService, createUserService, updateUserService, removeUserService, getUserCitiesService, updateUserCitiesService } from '../../services/userService.js';
import type UserI from '../../types/UserI.js';

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);
    if (user) {
      res.status(httpStatus.ok).send(user);
    } else {
      res.status(httpStatus.notFound).send({ msg: 'User not found!' });
    }
  } catch (error) {
    next(error);
  }
}

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  console.log(res.locals.token);
  try {
    const pagination = {
      skip: Number(req.query.skip) || 0,
      limit: Number(req.query.limit) || 0,
    };
    const users = await getUsersService(pagination);
    if (users && Array.isArray(users) && users.length > 0) {
      res.status(httpStatus.ok).send(users);
    } else {
      res.status(httpStatus.notFound).send({ msg: 'Users not found!' });
    }
  } catch (error) {
    next(error);
  }
}

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: UserI = {
      email: String(req.body.email),
      password: String(req.body.password)
    };

    const userCreated = await createUserService(user);
    if (userCreated) {
      res.status(httpStatus.ok).send(userCreated);
    } else {
      next('Ups! User not created');
    }
  } catch (error) {
    next(error);
  }
}

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: UserI = {
      _id: String(req.params.id),
    };
    if (req.body.email) user.email = String(req.body.email);
    if (req.body.password) user.password = String(req.body.password);

    const userUpdated = await updateUserService(user);
    if (userUpdated) {
      res.status(httpStatus.ok).send(userUpdated);
    } else {
      next('Ups! User not updated');
    }
  } catch (error) {
    next(error);
  }
}

const removeUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await removeUserService(id);
    if (user) {
      res.status(httpStatus.ok).send(user);
    } else {
      res.status(httpStatus.notFound).send({ msg: 'User not removed!' });
    }
  } catch (error) {
    next(error);
  }
}

const addCityToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userUpdated = await updateUserCitiesService(id, String(req.body.cityId));
    if (userUpdated) {
      res.status(httpStatus.ok).send(userUpdated);
    } else {
      res.status(httpStatus.notFound).send({ msg: 'User not found!' });
    }
  } catch (error) {
    next(error);
  }
}

const getUserCities = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userCities = await getUserCitiesService(id);
    if (userCities) {
      res.status(httpStatus.ok).send(userCities);
    } else {
      res.status(httpStatus.notFound).send({ msg: 'User cities not found!' });
    }
  } catch (error) {
    next(error);
  }
}

export { getUserById, getUsers, createUser, updateUser, removeUser, addCityToUser, getUserCities };
