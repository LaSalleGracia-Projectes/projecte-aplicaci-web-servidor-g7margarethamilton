import './loadEnvironment.js';
import express, { type Express } from 'express';
import { createConnection } from './config/db.js';
import apiRouter from './api/index.js';
import cors from 'cors';

const app: Express = express();
const port: string = process.env.HOST_PORT ?? '3000';

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Conectar a la base de datos Supabase/PostgreSQL
console.log('🌐INFO: Starting database connection...');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const db = await createConnection();
app.set('db', db); // Guardar la conexión en la app para usar en otros módulos

app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/v1', apiRouter);

export default app;
