import { Router, Request, Response } from 'express';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET: Llistar categories de l'usuari autenticat
 * URL: /api/v1/module-category/
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;
    try {
        const categories = await sql`
            SELECT * FROM task_category
            WHERE email = ${userId}
            ORDER BY created_at DESC`;
        res.json(categories);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al carregar les categories' });
    }
});

/**
 * GET: Obtenir una categoria per ID (només si és de l'usuari o admin)
 * URL: /api/v1/module-category/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const category = await sql`SELECT * FROM task_category WHERE id = ${id}`;
        if (category.length === 0) return res.status(404).json({ message: 'Categoria no trobada' });

        if (category[0].email !== userId && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per veure aquesta categoria' });
        }

        res.json(category[0]);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al obtenir la categoria' });
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
            INSERT INTO task_category (title, color, email, created_at)
            VALUES (${title}, ${color}, ${userId}, NOW())
            RETURNING *`;
        res.status(201).json({ message: 'Categoria creada', category: result[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al crear la categoria' });
    }
});

/**
 * PUT: Actualitzar una categoria (només si és de l'usuari o si és admin)
 * URL: /api/v1/module-category/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, color, userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const category = await sql`SELECT * FROM task_category WHERE id = ${id}`;
        if (category.length === 0) return res.status(404).json({ message: 'Categoria no trobada' });

        if (category[0].email !== userId && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per modificar aquesta categoria' });
        }

        const updated = await sql`
            UPDATE task_category
            SET title = ${title}, color = ${color}
            WHERE id = ${id}
            RETURNING *`;

        res.json({ message: 'Categoria actualitzada', category: updated[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al actualitzar la categoria' });
    }
});

/**
 * DELETE: Eliminar una categoria (només si és de l'usuari o si és admin)
 * URL: /api/v1/module-category/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const category = await sql`SELECT * FROM task_category WHERE id = ${id}`;
        if (category.length === 0) return res.status(404).json({ message: 'Categoria no trobada' });

        if (category[0].email !== userId && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per eliminar aquesta categoria' });
        }

        await sql`DELETE FROM task_category WHERE id = ${id}`;
        res.json({ message: 'Categoria eliminada correctament' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al eliminar la categoria' });
    }
});

export default router;
