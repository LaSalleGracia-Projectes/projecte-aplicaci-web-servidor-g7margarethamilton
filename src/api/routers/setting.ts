import { Router, Request, Response } from 'express';
import postgres from 'postgres';
import validateUserPermission from '../middlewares/validateUserPermission.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

/**
 * URL: /api/v1/setting/:email
 */
router.get('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        const settings = await sql`
            SELECT email, theme_mode, lang_code, allow_notification, merge_schedule_calendar, created_at
            FROM settings 
            WHERE email = ${email}`;
        
        if (settings.length === 0) {
            return res.status(404).json({ message: 'Configuració no trobada' });
        }

        res.json(settings[0]);
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

/**
 * URL: /api/v1/setting/:email
 */
router.put('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { theme_mode, lang_code, allow_notification, merge_schedule_calendar } = req.body;

        const updatedSettings = await sql`
            UPDATE settings 
            SET theme_mode = ${theme_mode}, 
                lang_code = ${lang_code}, 
                allow_notification = ${allow_notification}, 
                merge_schedule_calendar = ${merge_schedule_calendar}
            WHERE email = ${email}
            RETURNING *`;

        if (updatedSettings.length === 0) {
            return res.status(404).json({ message: 'Configuració no trobada' });
        }

        res.json({ message: 'Configuració actualitzada correctament', settings: updatedSettings[0] });
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

/**
 * URL: /api/v1/setting/:email
 */
router.delete('/:email', validateUserPermission, async (req: Request, res: Response) => {
    try {
        const { email } = req.params;

        const deletedSettings = await sql`
            DELETE FROM settings 
            WHERE email = ${email} 
            RETURNING *`;

        if (deletedSettings.length === 0) {
            return res.status(404).json({ message: 'Configuració no trobada' });
        }

        res.json({ message: 'Configuració eliminada correctament' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

export default router;
