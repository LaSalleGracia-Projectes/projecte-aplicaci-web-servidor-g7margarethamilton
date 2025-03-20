import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

const JWT_SECRET_WEB = process.env.JWT_SECRET_WEB ?? 'defaultsecret_web';
const JWT_SECRET_APP = process.env.JWT_SECRET_APP ?? 'defaultsecret_app';

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.split(' ')[1];
  const { email } = req.params; // Agafem l'email de la URL

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

    const userEmail = (decoded as { userId: string }).userId;

    // 🔍 Verifiquem que l'usuari existeix i que el token coincideix
    const user = await sql`
      SELECT web_token, app_token 
      FROM users 
      WHERE email = ${email}`;

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    const { web_token, app_token } = user[0];

    if (token !== web_token && token !== app_token) {
      return res.status(403).json({ message: 'Token no vàlid per a aquest usuari' });
    }

    req.body.userId = userEmail;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token invàlid' });
  }
};

export default authenticateToken;
