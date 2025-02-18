import './loadEnvironment.js';
import express, { type Express } from 'express';
import { createConnection } from './config/db.js';
import apiRouter from './api/index.js';
import cors from 'cors';
import authRouter from './api/routers/auth.js';

const app: Express = express();
const port: string = process.env.HOST_PORT ?? '3000';

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

console.log('🌐INFO: Starting database connection...');
const db = await createConnection();
app.set('db', db);

app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', apiRouter);
app.use('/auth', authRouter);

export default app;
