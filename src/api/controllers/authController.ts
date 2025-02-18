import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import httpStatus from '../config/httpStatusCodes.js';
import { createUserService, getUserService } from '../../services/userService.js';
import type UserI from '../../types/UserI.js';


const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: UserI = {
      email: String(req.body.email),
      password: String(req.body.password)
    };

    const userCreated = await createUserService(user);
    if (userCreated) {
      const secretKey = process.env.JWT_SECRET_KEY ?? 'secret';
      const token = jwt.sign({ _id: userCreated._id }, secretKey, { expiresIn: '900s' });
      res.status(httpStatus.ok).send({ userCreated, token });
    } else {
      next('Ups! User not created');
    }
  } catch (error) {
    next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const credentials = {
      email: String(req.body.email),
      password: String(req.body.password)
    };
    const user = await getUserService(credentials);
    if (user) {
      const secretKey = process.env.JWT_SECRET_KEY ?? 'secret';
      const token = jwt.sign({ _id: user._id }, secretKey, { expiresIn: '900s' });
      res.status(httpStatus.ok).send({ user, token });
    } else {
      res.status(httpStatus.notFound).send({ msg: 'User not found!' });
    }
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.headers.authorization;
    if (!refreshToken) {
      return res.status(httpStatus.badRequest).json({ message: 'Missing refresh token' });
    }

    const secretKey = process.env.JWT_SECRET_KEY ?? 'secret';
    jwt.verify(refreshToken, secretKey, (err, decoded: JwtPayload | undefined) => {
      if (err ?? !decoded) {
        console.error('Error verifying refresh token:', err);
        return res.status(httpStatus.unauthorized).json({ message: 'Invalid or expired refresh token' });
      }

      const userId: string = decoded._id as string;
      const newToken = jwt.sign({ _id: userId }, secretKey, { expiresIn: '900s' });

      return res.status(httpStatus.ok).json({ token: newToken });
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(httpStatus.internalServerError).json({ message: 'Internal server error' });
  }
};

export { register, login, refreshToken };
