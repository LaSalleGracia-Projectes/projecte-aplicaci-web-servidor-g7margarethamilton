import postgres, { type Sql } from 'postgres';
import { firebase_log, firebase_error } from './../logger.js';

let db: Sql | undefined;

const createConnection = async (): Promise<Sql> => {
    try {
        firebase_log('🔄INFO: Connecting to Supabase/PostgreSQL database...');

        const connectionString: string | undefined = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('❌ERROR: DATABASE_URL is not defined in the environment variables!!!');
        }

        db = postgres(connectionString, {
            ssl: 'require',
        }) ;

        await db.unsafe('SELECT 1');
        firebase_log('✅INFO: Connected to Supabase/PostgreSQL database.');

        return db;
    } catch (error) {
        firebase_error(`❌ERROR: Could not connect to database: ${(error as Error).message}`);
        process.exit(1);
    }
};

export { createConnection, db };
