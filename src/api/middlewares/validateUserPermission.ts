import { Request, Response, NextFunction } from 'express';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

const validateUserPermission = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.body; // Email del token desxifrat
  const { email } = req.params; // Email de la petició

  if (!userId) {
    return res.status(403).json({ message: 'No s’ha proporcionat cap ID d’usuari' });
  }

  try {
    // 🔍 Busquem l'usuari a la base de dades
    const user = await sql`
      SELECT is_admin 
      FROM users 
      WHERE email = ${email}`;

    if (user.length === 0) {
      return res.status(404).json({ message: 'Usuari no trobat' });
    }

    const { is_admin } = user[0];

    // ✅ L'usuari té permís si:
    if (userId === email || is_admin) {
      return next(); // Permet l'accés
    }

    // ❌ Si no compleix cap condició, retornem error
    return res.status(403).json({ message: 'No tens permís per accedir a aquest recurs' });
  } catch (error) {
    return res.status(500).json({ message: 'Error del servidor' });
  }
};

export default validateUserPermission;
