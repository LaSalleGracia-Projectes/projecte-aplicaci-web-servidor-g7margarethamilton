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

export default router;