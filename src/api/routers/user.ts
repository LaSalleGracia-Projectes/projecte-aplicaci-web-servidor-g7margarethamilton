import { Router, Request, Response } from 'express';
import postgres from 'postgres';
import validateUserPermission from '../middlewares/validateUserPermission.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
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
 * URL: /api/v1/user/:email
 */
router.put('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { nickname, avatar_url, is_admin, is_banned } = req.body;

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
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

/**
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
