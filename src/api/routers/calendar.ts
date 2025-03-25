import { Router, Request, Response } from 'express';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET: Tots els calendaris de l'usuari
 * URL: /api/v1/calendar/
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        const calendars = await sql`
            SELECT * FROM calendar
            WHERE email = ${userId}
            ORDER BY created_at DESC`;

        res.json(calendars);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al carregar els calendaris' });
    }
});

/**
 * GET: Un calendari per ID (només si és de l'usuari o si és admin)
 * URL: /api/v1/calendar/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const calendar = await sql`SELECT * FROM calendar WHERE id = ${id}`;
        if (calendar.length === 0) return res.status(404).json({ message: 'Calendari no trobat' });

        if (calendar[0].email !== userId && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per veure aquest calendari' });
        }

        res.json(calendar[0]);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al obtenir el calendari' });
    }
});

/**
 * POST: Crear un nou calendari
 * URL: /api/v1/calendar/
 */
router.post('/', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const { title, is_favorite, id_category } = req.body;

    try {
        const result = await sql`
            INSERT INTO calendar (title, is_favorite, email, id_category, created_at)
            VALUES (${title}, ${is_favorite}, ${userId}, ${id_category}, NOW())
            RETURNING *`;

        res.status(201).json({ message: 'Calendari creat', calendar: result[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al crear el calendari' });
    }
});

/**
 * PUT: Actualitzar un calendari (només si és de l'usuari o si és admin)
 * URL: /api/v1/calendar/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, is_favorite, id_category, userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const calendar = await sql`SELECT * FROM calendar WHERE id = ${id}`;
        if (calendar.length === 0) return res.status(404).json({ message: 'Calendari no trobat' });

        if (calendar[0].email !== userId && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per modificar aquest calendari' });
        }

        const updated = await sql`
            UPDATE calendar
            SET title = ${title}, is_favorite = ${is_favorite}, id_category = ${id_category}
            WHERE id = ${id}
            RETURNING *`;

        res.json({ message: 'Calendari actualitzat', calendar: updated[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al actualitzar el calendari' });
    }
});

export default router;