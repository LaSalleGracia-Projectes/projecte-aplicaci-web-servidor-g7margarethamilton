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

/**
 * GET: Categories d’un usuari
 * URL: /api/v1/module-category/:email
 */
router.get('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        const categories = await sql`
            SELECT id, title, color, email, created_at
            FROM module_category
            WHERE email = ${email}
            ORDER BY created_at DESC`;

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtenir categories' });
    }
});

/**
 * PUT: Actualitzar una categoria
 * URL: /api/v1/module-category/:email
 */
router.put('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { id, title, color } = req.body;

        const updated = await sql`
            UPDATE module_category
            SET title = ${title}, color = ${color}
            WHERE id = ${id} AND email = ${email}
            RETURNING *`;

        if (updated.length === 0) {
            return res.status(404).json({ message: 'Categoria no trobada o no et pertany' });
        }

        res.json({ message: 'Categoria actualitzada correctament', category: updated[0] });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualitzar categoria' });
    }
});

/**
 * DELETE: Eliminar una categoria
 * URL: /api/v1/module-category/:email
 */
router.delete('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { id } = req.body;

        const deleted = await sql`
            DELETE FROM module_category
            WHERE id = ${id} AND email = ${email}
            RETURNING *`;

        if (deleted.length === 0) {
            return res.status(404).json({ message: 'Categoria no trobada o no et pertany' });
        }

        res.json({ message: 'Categoria eliminada correctament' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar categoria' });
    }
});

export default router;
