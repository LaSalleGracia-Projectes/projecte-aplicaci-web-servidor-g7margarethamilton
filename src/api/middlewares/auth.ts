import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET_WEB = process.env.JWT_SECRET_WEB ?? 'defaultsecret_web';
const JWT_SECRET_APP = process.env.JWT_SECRET_APP ?? 'defaultsecret_app';

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Accés denegat' });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET_WEB);
    } catch {
      decoded = jwt.verify(token, JWT_SECRET_APP);
    }

    req.body.userId = (decoded as { userId: number }).userId;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token invàlid' });
  }
};

export default authenticateToken;
