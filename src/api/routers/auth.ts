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
    // Seleccionem un color aleatori
    const selectedColor = colors[Math.floor(Math.random() * colors.length)];
    // Generem l'URL de l'avatar
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=${selectedColor.bg}&color=${selectedColor.text}&size=128&font-size=0.5`;

    console.log(`✅INFO: Avatar successfully generated: ${avatarUrl}`);
    return avatarUrl;
};

/**
 * Link: /api/v1/auth/register
 */
router.post('/register',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').optional().isLength({ min: 9 }).withMessage('Password must be at least 9 characters long').matches(/^(?=(.*\d){3,})(?=(.*[a-z]){3,})(?=(.*[A-Z]){3,}).{9,}$/).withMessage('Password must contain at least 3 uppercase letters, 3 lowercase letters, and 3 numbers'),
        body('google_id').optional().isString(),
        body('nickname').isString()
    ],
    async (req: Request, res: Response) => {
        try {
            // Validem les dades rebudes
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            // Obtenim les dades de la petició
            const { email, password, google_id, nickname } = req.body;
            firebase_log(`📝INFO: Registering user with email: ${email}`);
            // Comprovem si l'usuari ja existeix
            const userExists = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (userExists.length > 0) {
                console.warn(`⚠️WARNING: Registration attempt with existing email: ${email}`);
                return res.status(409).json({ message: 'User already exists' });
            }
            // Generem un hash de la contrasenya
            if (!google_id && !password) {
                return res.status(400).json({ message: 'Password is required if not using Google Login.' });
            }
            // Generem un hash de la contrasenya
            const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
            // Generem un nickname per l'usuari
            const finalNickname = nickname ?? `user_${Math.floor(Math.random() * 10000)}`;
            // Obtenim l'avatar de l'usuari
            let finalAvatar = await getAvatarUrl(finalNickname, email);
            if (!finalAvatar) { // Si falla, ho intenta una altra vegada
                console.warn(`⚠️WARNING: Avatar fetch failed. Retrying...`);
                finalAvatar = await getAvatarUrl(finalNickname, email);
            }
            // Si falla dues vegades, retorna un error
            if (!finalAvatar) {
                firebase_error(`❌ERROR: Could not fetch avatar after two attempts. Registration halted.`);
                return res.status(500).json({ message: 'Error retrieving avatar. Please try again later.' });
            }
            // Comprovem si l'usuari s'està registrant amb Google
            const finalGoogleId = google_id ?? null;

            console.log({ email, hashedPassword, finalGoogleId, finalNickname, finalAvatar });
            // Guardem l'usuari a la base de dades
            await sql`
                INSERT INTO users (email, password, google_id, nickname, avatar_url, created_at) 
                VALUES (${email}, ${hashedPassword}, ${finalGoogleId}, ${finalNickname}, ${finalAvatar}, NOW())`;
            // Guardem la configuració per defecte de l'usuari a la base de dades
            await sql`
                INSERT INTO settings (email)
                VALUES (${email})`;

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

/**
 * Link: /api/v1/auth/web/login
 */
router.post('/web/login',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').optional().isLength({ min: 9 }).withMessage('Password must be at least 9 characters long').matches(/^(?=(.*\d){3,})(?=(.*[a-z]){3,})(?=(.*[A-Z]){3,}).{9,}$/).withMessage('Password must contain at least 3 uppercase letters, 3 lowercase letters, and 3 numbers'),
        body('google_id').optional().isString()
    ],
    async (req: Request, res: Response) => {
        try {
            // Validem les dades rebudes
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Obtenim les dades de la petició
            const { email, password, google_id } = req.body;
            firebase_log(`🔐INFO: Web login attempt for ${email}`);

            // Comprovem si l'usuari existeix
            const user = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (user.length === 0) {
                console.warn(`⚠️WARNING: Login attempt with non-existent email: ${email}`);
                return res.status(401).json({ message: 'Incorrect credentials' });
            }

            // Obtenim les dades de l'usuari
            const userData = user[0];

            // Comprovem si l'usuari ha fet login amb Google
            if (google_id) {
                // Comprovem si l'ID de Google és correcte
                if (userData.google_id !== google_id) {
                    console.warn(`⚠️WARNING: Login attempt with incorrect Google ID for ${email}`);
                    return res.status(401).json({ message: 'Invalid Google ID' });
                }
            } else {
                // Comprovem si la contrasenya és correcta
                const validPassword = await bcrypt.compare(password, userData.password);
                if (!validPassword) {
                    console.warn(`⚠️WARNING: Incorrect password for ${email}`);
                    return res.status(401).json({ message: 'Incorrect credentials' });
                }
            }

            let tokenWeb = userData.web_token; // Comprova si ja hi ha un token guardat
            
            if (tokenWeb) { // Comprova si el token és vàlid
                try {
                    // Verifica si el token és vàlid
                    jwt.verify(tokenWeb, JWT_SECRET_WEB);
                } catch (err) {
                    // Si el token ha expirat o és invàlid, es genera un de nou
                    console.warn(`⚠️WARNING: Expired or invalid web token for ${email}. Generating a new one.`);
                    tokenWeb = jwt.sign({ userId: userData.email }, JWT_SECRET_WEB, { expiresIn: '1d' });
                    await sql`UPDATE users SET web_token = ${tokenWeb} WHERE email = ${email}`;
                }
            } else {
                // Si no hi ha token, en genera un de nou
                tokenWeb = jwt.sign({ userId: userData.email }, JWT_SECRET_WEB, { expiresIn: '1d' });
                await sql`UPDATE users SET web_token = ${tokenWeb} WHERE email = ${email}`;
            }

            firebase_log(`✅INFO: Successful web login for ${email}`);

            res.json({
                tokenWeb,
                user: {
                    email: userData.email,
                    nickname: userData.nickname,
                    avatar_url: userData.avatar_url,
                },
                message: 'Successful login'
            });

        } catch (error: any) {
            firebase_error(`❌ERROR upon web login: ${(error as Error).message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * Link: /api/v1/auth/web/logout
 */
router.post('/web/logout', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        // Comprovem si l'usuari ha enviat les dades correctes
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Comprovem si l'usuari existeix
        const user = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = user[0];

        // Comprovem si la contrasenya és correcta
        const validPassword = await bcrypt.compare(password, userData.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Esborrem el token web de la base de dades
        await sql`UPDATE users SET web_token = NULL WHERE email = ${email}`;

        firebase_log(`✅INFO: Web logout successful for ${email}`);
        res.json({ message: 'Successfully logged out from the web' });

    } catch (error: any) {
        firebase_error(`❌ERROR during web logout: ${(error as Error).message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Link: /api/v1/auth/app/login
 */
router.post('/app/login',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').optional().isLength({ min: 9 }).withMessage('Password must be at least 9 characters long').matches(/^(?=(.*\d){3,})(?=(.*[a-z]){3,})(?=(.*[A-Z]){3,}).{9,}$/).withMessage('Password must contain at least 3 uppercase letters, 3 lowercase letters, and 3 numbers'),
        body('google_id').optional().isString()
    ],
    async (req: Request, res: Response) => {
        try {
            // Validem les dades rebudes
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Obtenim les dades de la petició
            const { email, password, google_id } = req.body;
            firebase_log(`🔐INFO: App login attempt for ${email}`);

            // Comprovem si l'usuari existeix
            const user = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (user.length === 0) {
                console.warn(`⚠️WARNING: Login attempt with non-existent email: ${email}`);
                return res.status(401).json({ message: 'Incorrect credentials' });
            }

            // Obtenim les dades de l'usuari
            const userData = user[0];

            // Comprovem si l'usuari ha fet login amb Google
            if (google_id) {
                // Comprovem si l'ID de Google és correcte
                if (userData.google_id !== google_id) {
                    console.warn(`⚠️WARNING: Login attempt with incorrect Google ID for ${email}`);
                    return res.status(401).json({ message: 'Invalid Google ID' });
                }
            } else {
                // Comprovem si la contrasenya és correcta
                const validPassword = await bcrypt.compare(password, userData.password);
                if (!validPassword) {
                    console.warn(`⚠️WARNING: Incorrect password for ${email}`);
                    return res.status(401).json({ message: 'Incorrect credentials' });
                }
            }

            let tokenApp = userData.app_token; // Comprova si ja hi ha un token guardat

            if (!tokenApp) { // Si no hi ha token, en genera un de nou
                tokenApp = jwt.sign({ userId: userData.email }, JWT_SECRET_APP);
                await sql`UPDATE users SET app_token = ${tokenApp} WHERE email = ${email}`;
            }

            firebase_log(`✅INFO: Successful app login for ${email}`);

            res.json({
                tokenApp,
                user: {
                    email: userData.email,
                    nickname: userData.nickname,
                    avatar_url: userData.avatar_url,
                },
                message: 'Successful login'
            });

        } catch (error: any) {
            firebase_error(`❌ERROR upon app login: ${(error as Error).message}`);
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * Link: /api/v1/auth/app/logout
 */
router.post('/app/logout', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        // Comprovem si s'han proporcionat les dades necessàries
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Comprovem si l'usuari existeix
        const user = await sql`SELECT * FROM users WHERE email = ${email}`;
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = user[0];

        // Comprovem si la contrasenya és correcta
        const validPassword = await bcrypt.compare(password, userData.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Esborrem el token de l'app de la base de dades
        await sql`UPDATE users SET app_token = NULL WHERE email = ${email}`;

        firebase_log(`✅INFO: App logout successful for ${email}`);
        res.json({ message: 'Successfully logged out from the app' });

    } catch (error: any) {
        firebase_error(`❌ERROR during app logout: ${(error as Error).message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
