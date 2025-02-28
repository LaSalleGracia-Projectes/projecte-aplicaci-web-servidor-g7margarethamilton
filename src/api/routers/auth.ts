import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import postgres from 'postgres';
import { firebase_log, firebase_error } from './../../logger.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });
const JWT_SECRET_WEB = process.env.JWT_SECRET_WEB ?? 'defaultsecret_web';
const JWT_SECRET_APP = process.env.JWT_SECRET_APP ?? 'defaultsecret_app';

const getAvatarUrl = async (name: string, email: string): Promise<string> => {
    console.log(`🌐INFO: Generating avatar for ${name || email}...`);

    const colors = [
        { bg: "0D47A1", text: "FFFFFF" }, // Dark Blue
        { bg: "64B5F6", text: "000000" }, // Light Blue
        { bg: "D32F2F", text: "FFFFFF" }, // Dark Red
        { bg: "F57C00", text: "FFFFFF" }, // Orange
        { bg: "FBC02D", text: "000000" }, // Yellow
        { bg: "388E3C", text: "FFFFFF" }, // Dark Green
        { bg: "81C784", text: "000000" }, // Light Green
        { bg: "7B1FA2", text: "FFFFFF" }, // Dark Purple
        { bg: "212121", text: "FFFFFF" }, // Black
        { bg: "E0E0E0", text: "000000" }  // Light Gray
    ];

    const selectedColor = colors[Math.floor(Math.random() * colors.length)];

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=${selectedColor.bg}&color=${selectedColor.text}&size=128&font-size=0.5`;

    console.log(`✅INFO: Avatar successfully generated: ${avatarUrl}`);
    return avatarUrl;
};

router.post('/register',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').optional().isLength({ min: 9 }).withMessage('Password must be at least 9 characters long').matches(/^(?=(.*\d){3,})(?=(.*[a-z]){3,})(?=(.*[A-Z]){3,}).{9,}$/).withMessage('Password must contain at least 3 uppercase letters, 3 lowercase letters, and 3 numbers'),
        body('google_id').optional().isString(),
        body('nickname').isString()
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, google_id, nickname } = req.body;
            firebase_log(`📝INFO: Registering user with email: ${email}`);

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
                firebase_error(`❌ERROR: Could not fetch avatar after two attempts. Registration halted.`);
                return res.status(500).json({ message: 'Error retrieving avatar. Please try again later.' });
            }

            const finalGoogleId = google_id ?? null;

            console.log({ email, hashedPassword, finalGoogleId, finalNickname, finalAvatar });

            await sql`
                INSERT INTO users (email, password, google_id, nickname, avatar_url, created_at) 
                VALUES (${email}, ${hashedPassword}, ${finalGoogleId}, ${finalNickname}, ${finalAvatar}, NOW())`;

            firebase_log(`✅INFO: User successfully registered: ${email}`);
            res.status(201).json({ message: 'User successfully registered', avatar_url: finalAvatar });

        } catch (error: any) {
            firebase_error(`❌ERROR during registration: ${(error as Error).message}`);

            if (error.code === '23505') {
                return res.status(409).json({ message: 'User already exists' });
            }

            res.status(500).json({ message: 'Server error' });
        }
    }
);

router.post('/login',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').optional().isLength({ min: 9 }).withMessage('Password must be at least 9 characters long').matches(/^(?=(.*\d){3,})(?=(.*[a-z]){3,})(?=(.*[A-Z]){3,}).{9,}$/).withMessage('Password must contain at least 3 uppercase letters, 3 lowercase letters, and 3 numbers'),
        body('google_id').optional().isString()
    ],
    async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { email, password, google_id } = req.body;
            firebase_log(`🔐INFO: Login attempt for ${email}`);

            const user = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (user.length === 0) {
                console.warn(`⚠️WARNING: Login attempt with non-existent email: ${email}`);
                return res.status(401).json({ message: 'Incorrect credentials' });
            }

            const userData = user[0];

            if (google_id) {
                if (userData.google_id !== google_id) {
                    console.warn(`⚠️WARNING: Login attempt with incorrect Google ID for ${email}`);
                    return res.status(401).json({ message: 'Invalid Google ID' });
                }
            } else {
                const validPassword = await bcrypt.compare(password, userData.password);
                if (!validPassword) {
                    console.warn(`⚠️WARNING: Incorrect password for ${email}`);
                    return res.status(401).json({ message: 'Incorrect credentials' });
                }
            }

            const tokenWeb = jwt.sign({ userId: userData.email }, JWT_SECRET_WEB, { expiresIn: '1d' });
            const tokenApp = jwt.sign({ userId: userData.email }, JWT_SECRET_APP);

            firebase_log(`✅INFO: Successful login for ${email}`);

            res.json({
                tokenWeb,
                tokenApp,
                user: {
                    email: userData.email,
                    nickname: userData.nickname,
                    avatar_url: userData.avatar_url,
                },
                message: 'Successful login'
            });

        } catch (error: any) {
            firebase_error(`❌ERROR upon login: ${(error as Error).message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
