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

export default router;