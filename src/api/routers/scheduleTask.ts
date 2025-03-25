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

/**
 * GET: Una tasca per ID (només si l’schedule és de l’usuari o admin)
 * URL: /api/v1/schedule-task/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        const task = await sql`SELECT * FROM schedule_task WHERE id = ${id}`;
        if (task.length === 0) return res.status(404).json({ message: 'Tasca no trobada' });

        const schedule = await sql`SELECT email FROM schedule WHERE id = ${task[0].id_shedule}`;
        const isOwner = schedule[0]?.email === userId;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per veure aquesta tasca' });
        }

        res.json(task[0]);
    } catch (error: any) {
        res.status(500).json({ message: 'Error al obtenir la tasca' });
    }
});

/**
 * POST: Crear una nova tasca
 * URL: /api/v1/schedule-task/
 */
router.post('/', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const {
        title, content, priority,
        start_time, end_time,
        id_shedule, id_category
    } = req.body;

    try {
        const schedule = await sql`SELECT email FROM schedule WHERE id = ${id_shedule}`;
        if (schedule.length === 0) return res.status(404).json({ message: 'Schedule no trobat' });

        if (schedule[0].email !== userId) {
            return res.status(403).json({ message: 'No tens permís per afegir tasques a aquest schedule' });
        }

        const result = await sql`
            INSERT INTO schedule_task 
            (title, content, priority, start_time, end_time, id_shedule, id_category, created_at)
            VALUES (
                ${title}, ${content}, ${priority}, ${start_time}, ${end_time}, ${id_shedule}, ${id_category}, NOW()
            )
            RETURNING *`;

        res.status(201).json({ message: 'Tasca creada', task: result[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al crear la tasca' });
    }
});

export default router;
