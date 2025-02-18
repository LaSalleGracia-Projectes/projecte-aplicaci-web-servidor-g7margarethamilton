import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });
const JWT_SECRET = process.env.JWT_SECRET_KEY ?? 'defaultsecret';

router.post('/register',
  [
    body('email').isEmail().withMessage('Email invàlid'),
    body('password').isLength({ min: 6 }).withMessage('La contrasenya ha de tenir almenys 6 caràcters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const userExists = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (userExists.length > 0) {
        return res.status(400).json({ message: 'L’usuari ja existeix' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await sql`INSERT INTO users (email, password) VALUES (${email}, ${hashedPassword})`;

      res.status(201).json({ message: 'Usuari registrat correctament' });
    } catch (error) {
      console.error('ERROR al registrar:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Email invàlid'),
    body('password').exists().withMessage('Cal introduir una contrasenya')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (user.length === 0) {
        return res.status(400).json({ message: 'Credencials incorrectes' });
      }

      const validPassword = await bcrypt.compare(password, user[0].password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Credencials incorrectes' });
      }

      const token = jwt.sign({ userId: user[0].id }, JWT_SECRET, { expiresIn: '1h' });

      res.json({ token, message: 'Login correcte' });
    } catch (error) {
      console.error('ERROR al iniciar sessió:', error);
      res.status(500).json({ message: 'Error del servidor' });
    }
  }
);

export default router;
