import { Router, Request, Response } from 'express';
import authRouter from './routers/auth.js';
import logRouter from './routers/log.js';
import userRouter from './routers/user.js';
import settingRouter from './routers/setting.js';
import moduleCategoryRouter from './routers/moduleCategory.js';
import taskCategoryRouter from './routers/taskCategory.js';
import scheduleRouter from './routers/schedule.js';
import scheduleTaskRouter from './routers/scheduleTask.js';
import calendarRouter from './routers/calendar.js';
import calendarTaskRouter from './routers/calendarTask.js';
import authenticateToken from './middlewares/auth.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/log', logRouter);

router.use(authenticateToken);

router.use('/user', userRouter);
router.use('/setting', settingRouter);

router.use('/schedule', scheduleRouter);
router.use('/schedule-task', scheduleTaskRouter);

router.use('/calendar', calendarRouter);
router.use('/calendar-task', calendarTaskRouter);

router.use('/module-category', moduleCategoryRouter);
router.use('/task-category', taskCategoryRouter);

router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  res.json({ 
    message: 'Aquesta ruta està protegida', 
    userId: req.body.userId 
  });
});

export default router;
