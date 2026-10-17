import { Router } from 'express';
import prisma from '../prisma/client.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/notifications - List user's notifications
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark single as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export default router;
