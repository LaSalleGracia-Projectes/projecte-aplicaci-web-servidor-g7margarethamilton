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

/**
 * POST: Crear una nova categoria
 * URL: /api/v1/module-category/
 */
router.post('/', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const { title, color } = req.body;

    try {
        const result = await sql`
            INSERT INTO module_category (title, color, email, created_at)
            VALUES (${title}, ${color}, ${userId}, NOW())
            RETURNING *`;

        res.status(201).json({ message: 'Categoria creada correctament', category: result[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear la categoria' });
    }
});

export default router;
