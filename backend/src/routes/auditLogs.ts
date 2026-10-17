import { Router } from 'express';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// GET /api/audit-logs - Hospital security and operational audit trail
router.get('/', authenticate, authorize(['ADMIN', 'RECEPTIONIST']), async (req, res, next) => {
  try {
    const { action, limit } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(action ? { action: String(action) } : {}),
      },
      include: {
        user: { select: { fullName: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(String(limit), 10) : 100,
    });

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
});

export default router;
