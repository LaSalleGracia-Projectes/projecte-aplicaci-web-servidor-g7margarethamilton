import { Router, Request, Response } from 'express';
import postgres from 'postgres';
import validateUserPermission from '../middlewares/validateUserPermission.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET totes les categories (només per administradors)
 * URL: /api/v1/module-category/
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        if (!user[0]?.is_admin) {
            return res.status(403).json({ message: 'Només els administradors poden veure totes les categories' });
        }

        const categories = await sql`
            SELECT id, title, color, email, created_at
            FROM module_category
            ORDER BY created_at DESC`;

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtenir totes les categories' });
    }
});

export default router;
