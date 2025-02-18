import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import postgres from 'postgres';
import axios from 'axios';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });
const JWT_SECRET_WEB = process.env.JWT_SECRET_WEB ?? 'defaultsecret_web';
const JWT_SECRET_APP = process.env.JWT_SECRET_APP ?? 'defaultsecret_app';

const getAvatarUrl = async (name: string, email: string): Promise<string> => {
    try {
        console.log(`🌐INFO: Generating avatar for ${name || email}...`);
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`;
        
        const response = await axios.get(avatarUrl, { timeout: 5000 });

        if (response.status === 200) {
            console.log(`✅INFO: Avatar successfully generated: ${avatarUrl}`);
            return avatarUrl;
        } else {
            throw new Error('UI Avatars did not return a valid response.');
        }
    } catch (error) {
        console.error(`❌ERROR: Failed to fetch avatar for ${name || email}:`, error);
        return 'https://example.com/default-avatar.png';
    }
};

router.post('/register',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
        body('google_id').optional().isString(),
        body('nickname').optional().isString()
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, google_id, nickname } = req.body;
            console.log(`📝INFO: Registering user with email: ${email}`);

            const userExists = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (userExists.length > 0) {
                console.warn(`⚠️WARNING: Registration attempt with existing email: ${email}`);
                return res.status(409).json({ message: 'User already exists' });
            }

            if (!google_id && !password) {
                return res.status(400).json({ message: 'Password is required if not using Google Login.' });
            }

            const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
            const finalNickname = nickname ?? `user_${Math.floor(Math.random() * 10000)}`;

            let finalAvatar = await getAvatarUrl(finalNickname, email);
            if (!finalAvatar) {
                console.warn(`⚠️WARNING: Avatar fetch failed. Retrying...`);
                finalAvatar = await getAvatarUrl(finalNickname, email);
            }

            if (!finalAvatar) {
                console.error(`❌ERROR: Could not fetch avatar after two attempts. Registration halted.`);
                return res.status(500).json({ message: 'Error retrieving avatar. Please try again later.' });
            }

            const finalGoogleId = google_id ?? null;

            console.log({ email, hashedPassword, finalGoogleId, finalNickname, finalAvatar });

            await sql`
                INSERT INTO users (email, password, google_id, nickname, avatar_url, created_at) 
                VALUES (${email}, ${hashedPassword}, ${finalGoogleId}, ${finalNickname}, ${finalAvatar}, NOW())`;

            console.log(`✅INFO: User successfully registered: ${email}`);
            res.status(201).json({ message: 'User successfully registered', avatar_url: finalAvatar });

        } catch (error: any) {
            console.error('❌ERROR during registration:', error);

            if (error.code === '23505') {
                return res.status(409).json({ message: 'User already exists' });
            }

            res.status(500).json({ message: 'Server error' });
        }
    }
);

router.post('/login',
    [
        body('email').isEmail().withMessage('Email invàlid'),
        body('password').optional().isString(),
        body('google_id').optional().isString()
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, google_id } = req.body;
            console.log(`🔐INFO: Intent de login per ${email}`);

            const user = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (user.length === 0) {
                console.warn(`⚠️WARNING: Intent de login amb email no existent: ${email}`);
                return res.status(401).json({ message: 'Credencials incorrectes' });
            }

            const userData = user[0];

            if (google_id) {
                if (userData.google_id !== google_id) {
                    console.warn(`⚠️WARNING: Intent de login amb Google ID incorrecte per ${email}`);
                    return res.status(401).json({ message: 'Google ID no vàlid' });
                }
            } else {
                const validPassword = await bcrypt.compare(password, userData.password);
                if (!validPassword) {
                    console.warn(`⚠️WARNING: Contrasenya incorrecta per ${email}`);
                    return res.status(401).json({ message: 'Credencials incorrectes' });
                }
            }

            const tokenWeb = jwt.sign({ userId: userData.email }, JWT_SECRET_WEB, { expiresIn: '1d' });
            const tokenApp = jwt.sign({ userId: userData.email }, JWT_SECRET_APP);

            console.log(`✅INFO: Login correcte per ${email}`);

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

        } catch (error: any) {
            console.error('❌ERROR al iniciar sessió:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    }
);

export default router;
