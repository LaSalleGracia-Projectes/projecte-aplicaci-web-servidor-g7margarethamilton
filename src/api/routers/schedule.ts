import { Router, Request, Response } from 'express';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET: Totes les agendes de l'usuari
 * URL: /api/v1/schedule/
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        const schedules = await sql`
            SELECT * FROM schedule
            WHERE email = ${userId}
            ORDER BY created_at DESC`;

        res.json(schedules);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al carregar les agendes' });
    }
});

/**
 * GET: Una agenda per ID (només si és de l'usuari o si és admin)
 * URL: /api/v1/schedule/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const schedule = await sql`SELECT * FROM schedule WHERE id = ${id}`;
        if (schedule.length === 0) return res.status(404).json({ message: 'Agenda no trobada' });

        if (schedule[0].email !== userId && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per veure aquesta agenda' });
        }

        res.json(schedule[0]);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al obtenir l’agenda' });
    }
});

export default router;