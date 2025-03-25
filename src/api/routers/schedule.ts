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

export default router;