import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });
const JWT_SECRET_WEB = process.env.JWT_SECRET_WEB ?? 'defaultsecret_web';
const JWT_SECRET_APP = process.env.JWT_SECRET_APP ?? 'defaultsecret_app';

const getAvatarUrl = async (email: string): Promise<string> => {
    try {
        const response = await axios.get(`https://unavatar.io/${email}`);
        return response.data.url;
    } catch {
        return 'https://example.com/default-avatar.png';
    }
};

router.post('/register',
    [
        body('email').isEmail().withMessage('Email invàlid'),
        body('password').optional().isLength({ min: 6 }).withMessage('La contrasenya ha de tenir almenys 6 caràcters'),
        body('google_id').optional().isString(),
        body('nickname').optional().isString(),
        body('avatar_url').optional().isString()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, google_id, nickname, avatar_url } = req.body;

        try {
            const userExists = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (userExists.length > 0) {
                return res.status(400).json({ message: 'L’usuari ja existeix' });
            }

            if (!google_id && !password) {
                return res.status(400).json({ message: 'La contrasenya és obligatòria si no s’utilitza Google Login.' });
            }

            const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

            const finalNickname = nickname || `user_${Math.floor(Math.random() * 10000)}`;

            const finalAvatar = avatar_url || await getAvatarUrl(email);

            await sql`
          INSERT INTO users (email, password, google_id, nickname, avatar_url, created_at) 
          VALUES (${email}, ${hashedPassword}, ${google_id}, ${finalNickname}, ${finalAvatar}, NOW())`;

            res.status(201).json({ message: 'Usuari registrat correctament', avatar_url: finalAvatar });
        } catch (error) {
            console.error('ERROR al registrar:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }
);

router.post('/login',
    [
        body('email').isEmail().withMessage('Email invàlid'),
        body('password').optional().isString(),
        body('google_id').optional().isString()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, google_id } = req.body;

        try {
            const user = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (user.length === 0) {
                return res.status(400).json({ message: 'Credencials incorrectes' });
            }

            const userData = user[0];

            if (google_id) {
                if (userData.google_id !== google_id) {
                    return res.status(400).json({ message: 'Google ID no vàlid' });
                }
            } else {
                const validPassword = await bcrypt.compare(password, userData.password);
                if (!validPassword) {
                    return res.status(400).json({ message: 'Credencials incorrectes' });
                }
            }

            const tokenWeb = jwt.sign({ userId: userData.email }, JWT_SECRET_WEB, { expiresIn: '1d' });

            const tokenApp = jwt.sign({ userId: userData.email }, JWT_SECRET_APP);

            res.json({
                tokenWeb,
                tokenApp,
                user: {
                    email: userData.email,
                    nickname: userData.nickname,
                    avatar_url: userData.avatar_url,
                },
                message: 'Login correcte'
            });
        } catch (error) {
            console.error('ERROR al iniciar sessió:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }
);

export default router;
