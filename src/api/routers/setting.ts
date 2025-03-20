import { Router, Request, Response } from 'express';
import postgres from 'postgres';
import { firebase_log, firebase_error } from './../../logger.js';

const router = Router();
const sql = postgres(process.env.DATABASE_URL ?? '', { ssl: 'require' });

const settingsRouter = Router();

/**
 * URL: /api/v1/setting/:email
 */
router.get('/:email', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        firebase_log(`🔍INFO: Fetching settings for ${email}`);

        const settings = await sql`
            SELECT email, theme_mode, lang_code, allow_notification, merge_schedule_calendar, created_at
            FROM settings 
            WHERE email = ${email}`;
        
        if (settings.length === 0) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        res.json(settings[0]);
    } catch (error: any) {
        firebase_error(`❌ERROR fetching settings: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * URL: /api/v1/setting/:email
 */
router.put('/:email', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const { theme_mode, lang_code, allow_notification, merge_schedule_calendar } = req.body;
        
        firebase_log(`✏️INFO: Updating settings for ${email}`);

        const updatedSettings = await sql`
            UPDATE settings 
            SET theme_mode = ${theme_mode}, 
                lang_code = ${lang_code}, 
                allow_notification = ${allow_notification}, 
                merge_schedule_calendar = ${merge_schedule_calendar}
            WHERE email = ${email}
            RETURNING *`;

        if (updatedSettings.length === 0) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        res.json({ message: 'Settings updated successfully', settings: updatedSettings[0] });
    } catch (error: any) {
        firebase_error(`❌ERROR updating settings: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * URL: /api/v1/setting/:email
 */
router.delete('/:email', async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        firebase_log(`❌INFO: Deleting settings for ${email}`);

        const deletedSettings = await sql`DELETE FROM settings WHERE email = ${email} RETURNING *`;

        if (deletedSettings.length === 0) {
            return res.status(404).json({ message: 'Settings not found' });
        }

        res.json({ message: 'Settings deleted successfully' });
    } catch (error: any) {
        firebase_error(`❌ERROR deleting settings: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
