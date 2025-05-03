import { Router, Request, Response } from 'express';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import validateUserPermission from '../middlewares/validateUserPermission.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET: Obtenir tots els usuaris (només per admins)
 * URL: /api/v1/user
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        if (!isAdmin) {
            return res.status(403).json({ message: 'No tens permisos per accedir a la llista d’usuaris' });
        }

        const users = await sql`
            SELECT email, google_id, nickname, avatar_url, is_admin, is_banned, created_at
            FROM users
            ORDER BY created_at DESC`;

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtenir usuaris' });
    }
});

/**
 * GET: Obtenir les dades de l'usuari
 * URL: /api/v1/user/:email
 */
router.get('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        const user = await sql`
            SELECT email, google_id, nickname, avatar_url, is_admin, is_banned, created_at 
            FROM users 
            WHERE email = ${email}`;
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'Usuari no trobat' });
        }

        res.json(user[0]);
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

/**
 * PUT: Actualitzar les dades de l'usuari
 * URL: /api/v1/user/:email
 */
router.put('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { nickname, avatar_url, is_admin, is_banned, password } = req.body;

        if (password) {
            const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
            const updatedUser = await sql`
                UPDATE users 
                SET password = ${hashedPassword}
                WHERE email = ${email}
                RETURNING email, nickname, avatar_url, is_admin, is_banned, created_at`;

                if (updatedUser.length === 0) {
                    return res.status(404).json({ message: 'Usuari no trobat' });
                }
    
                res.json({ message: 'Contrasenya actualitzada correctament', user: updatedUser[0] });
        } else {
            const updatedUser = await sql`
                UPDATE users 
                SET nickname = ${nickname}, 
                    avatar_url = ${avatar_url}, 
                    is_admin = ${is_admin}, 
                    is_banned = ${is_banned}
                WHERE email = ${email}
                RETURNING email, nickname, avatar_url, is_admin, is_banned, created_at`;

            if (updatedUser.length === 0) {
                return res.status(404).json({ message: 'Usuari no trobat' });
            }

            res.json({ message: 'Usuari actualitzat correctament', user: updatedUser[0] });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor: ' + error.message });
    }
});

/**
 * DELETE: Eliminar un usuari
 * URL: /api/v1/user/:email
 */
router.delete('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        await sql`DELETE FROM settings WHERE email = ${email}`;
        const deletedUser = await sql`DELETE FROM users WHERE email = ${email} RETURNING *`;

        if (deletedUser.length === 0) {
            return res.status(404).json({ message: 'Usuari no trobat' });
        }

        res.json({ message: 'Usuari eliminat correctament' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

export default router;
