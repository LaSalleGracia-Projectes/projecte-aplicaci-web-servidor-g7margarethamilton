import { Router, Request, Response } from 'express';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET: Totes les tasques del calendari de l'usuari
 * URL: /api/v1/calendar-task/
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        const calendars = await sql`SELECT id FROM calendar WHERE email = ${userId}`;
        const calendarIds = calendars.map((c: any) => c.id);

        if (calendarIds.length === 0) {
            return res.json([]);
        }

        const tasks = await sql`
            SELECT * FROM calendar_task
            WHERE id_calendar = ANY(${calendarIds})
            ORDER BY start_time ASC`;

        res.json(tasks);
    } catch {
        res.status(500).json({ message: 'Error al obtenir les tasques' });
    }
});

export default router;