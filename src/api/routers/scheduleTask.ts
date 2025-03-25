import { Router, Request, Response } from 'express';
import postgres from 'postgres';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * GET: Totes les tasques de l'usuari (a partir dels seus schedules)
 * URL: /api/v1/schedule-task/
 */
router.get('/', async (req: Request, res: Response) => {
    const { userId } = req.body;

    try {
        const schedules = await sql`
            SELECT id FROM schedule WHERE email = ${userId}`;
        const scheduleIds = schedules.map((s: any) => s.id);

        if (scheduleIds.length === 0) {
            return res.json([]); // No hi ha cap schedule → cap tasca
        }

        const tasks = await sql`
            SELECT * FROM schedule_task
            WHERE id_shedule = ANY(${scheduleIds})
            ORDER BY start_time ASC`;

        res.json(tasks);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al obtenir les tasques' });
    }
});

export default router;
