import { Router, Request, Response } from 'express';
import authRouter from './routers/auth.js';
import authenticateToken from './middlewares/auth.js';

const router = Router();

router.use('/auth', authRouter);

router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  res.json({ 
    message: 'Aquesta ruta està protegida', 
    userId: req.body.userId 
  });
});

export default router;
