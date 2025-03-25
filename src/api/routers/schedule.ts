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

/**
 * POST: Crear una nova agenda
 * URL: /api/v1/schedule/
 */
router.post('/', async (req: Request, res: Response) => {
    const { userId } = req.body;
    const { title, is_favorite, id_category } = req.body;

    try {
        const result = await sql`
            INSERT INTO schedule (title, is_favorite, email, id_category, created_at)
            VALUES (${title}, ${is_favorite}, ${userId}, ${id_category}, NOW())
            RETURNING *`;

        res.status(201).json({ message: 'Agenda creada', schedule: result[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error al crear l’agenda' });
    }
});

/**
* PUT: Actualitzar una agenda (només si és de l'usuari o si és admin)
* URL: /api/v1/schedule/:id
*/
router.put('/:id', async (req: Request, res: Response) => {
   const { id } = req.params;
   const { title, is_favorite, id_category, userId } = req.body;

   try {
       const user = await sql`SELECT is_admin FROM users WHERE email = ${userId}`;
       const isAdmin = user[0]?.is_admin;

       const schedule = await sql`SELECT * FROM schedule WHERE id = ${id}`;
       if (schedule.length === 0) return res.status(404).json({ message: 'Agenda no trobada' });

       if (schedule[0].email !== userId && !isAdmin) {
           return res.status(403).json({ message: 'No tens permís per modificar aquesta agenda' });
       }

       const updated = await sql`
           UPDATE schedule
           SET title = ${title}, is_favorite = ${is_favorite}, id_category = ${id_category}
           WHERE id = ${id}
           RETURNING *`;

       res.json({ message: 'Agenda actualitzada', schedule: updated[0] });
   } catch (error: any) {
       res.status(500).json({ message: 'Error al actualitzar l’agenda' });
   }
});

export default router;