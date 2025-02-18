import postgres, { type Sql } from 'postgres';

// Definimos explícitamente el tipo de db para evitar any
let db: Sql | undefined;

const createConnection = async (): Promise<Sql> => {
    try {
        console.log('🔄INFO: Connecting to Supabase/PostgreSQL database...');

        // Obtener la URL de conexión de Supabase desde las variables de entorno
        const connectionString: string | undefined = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('❌ERROR: DATABASE_URL is not defined in the environment variables!!!');
        }

        // Crear la conexión con la base de datos
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        db = postgres(connectionString, {
            ssl: 'require', // Supabase requiere SSL
        }) ;

        // Verificar la conexión realizando una consulta simple
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await db.unsafe('SELECT 1');
        console.log('✅INFO: Connected to Supabase/PostgreSQL database.');

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return db;
    } catch (error) {
        console.error('❌ERROR: Could not connect to database:', (error as Error).message);
        process.exit(1); // Terminar el proceso si la conexión falla
    }
};

// Exportamos la función y la conexión para reutilización en otros módulos
export { createConnection, db };
