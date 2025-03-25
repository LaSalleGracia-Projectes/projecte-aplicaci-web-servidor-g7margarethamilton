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

/**
 * GET: Una tasca per ID
 * URL: /api/v1/calendar-task/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const task = await sql`SELECT * FROM calendar_task WHERE id = ${id}`;
        if (task.length === 0) return res.status(404).json({ message: 'Tasca no trobada' });

        const calendar = await sql`SELECT email FROM calendar WHERE id = ${task[0].id_calendar}`;
        const isOwner = calendar[0]?.email === userId;

        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per veure aquesta tasca' });
        }

        res.json(task[0]);
    } catch {
        res.status(500).json({ message: 'Error al obtenir la tasca' });
    }
});

/**
 * POST: Crear una nova tasca al calendari
 * URL: /api/v1/calendar-task/
 */
router.post('/', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const { title, content, is_completed, priority, start_time, end_time, id_calendar, id_category } = req.body;

    try {
        const calendar = await sql`SELECT email FROM calendar WHERE id = ${id_calendar}`;
        if (calendar.length === 0) return res.status(404).json({ message: 'Calendari no trobat' });

        if (calendar[0].email !== userId) {
            return res.status(403).json({ message: 'No tens permís per afegir tasques a aquest calendari' });
        }

        const result = await sql`
            INSERT INTO calendar_task (title, content, is_completed, priority, start_time, end_time, id_calendar, id_category, created_at)
            VALUES (${title}, ${content}, ${is_completed}, ${priority}, ${start_time}, ${end_time}, ${id_calendar}, ${id_category}, NOW())
            RETURNING *`;

        res.status(201).json({ message: 'Tasca creada', task: result[0] });
    } catch {
        res.status(500).json({ message: 'Error al crear la tasca' });
    }
});

/**
 * PUT: Actualitzar una tasca del calendari
 * URL: /api/v1/calendar-task/:id
 */
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, content, is_completed, priority, start_time, end_time, id_calendar, id_category, userId } = req.body;

    try {
        const task = await sql`SELECT * FROM calendar_task WHERE id = ${id}`;
        if (task.length === 0) return res.status(404).json({ message: 'Tasca no trobada' });

        const calendar = await sql`SELECT email FROM calendar WHERE id = ${task[0].id_calendar}`;
        const isOwner = calendar[0]?.email === userId;

        const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
        const isAdmin = user[0]?.is_admin;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tens permís per modificar aquesta tasca' });
        }

        const updated = await sql`
            UPDATE calendar_task
            SET title = ${title}, content = ${content}, is_completed = ${is_completed},
                priority = ${priority}, start_time = ${start_time}, end_time = ${end_time},
                id_calendar = ${id_calendar}, id_category = ${id_category}
            WHERE id = ${id}
            RETURNING *`;

        res.json({ message: 'Tasca actualitzada', task: updated[0] });
    } catch {
        res.status(500).json({ message: 'Error al actualitzar la tasca' });
    }
});

export default router;