import { Router, Request, Response } from 'express';
import postgres from 'postgres';
import { firebase_log, firebase_error } from './../../logger.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * URL: /api/v1/user/:email
 */
router.get('/:email', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        firebase_log(`🔍INFO: Fetching user ${email}`);

        const user = await sql`
            SELECT email, google_id, nickname, avatar_url, is_admin, is_banned, created_at 
            FROM users 
            WHERE email = ${email}`;
        
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user[0]);
    } catch (error: any) {
        firebase_error(`❌ERROR fetching user: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * URL: /api/v1/user/:email
 */
router.put('/:email', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { nickname, avatar_url, is_admin, is_banned } = req.body;
        
        firebase_log(`✏️INFO: Updating user ${email}`);

        const updatedUser = await sql`
            UPDATE users 
            SET nickname = ${nickname}, 
                avatar_url = ${avatar_url}, 
                is_admin = ${is_admin}, 
                is_banned = ${is_banned}
            WHERE email = ${email}
            RETURNING email, nickname, avatar_url, is_admin, is_banned, created_at`;

        if (updatedUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user: updatedUser[0] });
    } catch (error: any) {
        firebase_error(`❌ERROR updating user: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * URL: /api/v1/user/:email
 */
router.delete('/:email', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        firebase_log(`❌INFO: Deleting user ${email}`);

        // Esborrem la configuració associada abans de l'usuari (per integritat referencial)
        await sql`DELETE FROM settings WHERE email = ${email}`;

        const deletedUser = await sql`DELETE FROM users WHERE email = ${email} RETURNING *`;

        if (deletedUser.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        firebase_error(`❌ERROR deleting user: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;