import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { previewEmergencyImpact, confirmEmergencyQueueChange } from '../services/queueEngine.js';

const router = Router();

const confirmEmergencySchema = z.object({
  queueId: z.string().min(1, 'Target queue is required'),
  reason: z.string().min(5, 'Clinical reason for emergency priority is required'),
  proposedDelayMins: z.number().int().min(5).max(120).default(15),
  emergencyToken: z.string().optional(),
});

// GET /api/emergencies/preview - Emergency Impact Preview
router.get('/preview', authenticate, authorize(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), async (req, res, next) => {
  try {
    const { queueId, proposedDelayMins } = req.query;

    if (!queueId) {
      return res.status(400).json({ success: false, message: 'queueId is required for preview' });
    }

    const delay = proposedDelayMins ? parseInt(String(proposedDelayMins), 10) : 15;

    const preview = await previewEmergencyImpact(String(queueId), delay);

    res.json({
      success: true,
      preview,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/emergencies/confirm - Confirm & Apply Emergency Queue Override
router.post('/confirm', authenticate, authorize(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = confirmEmergencySchema.parse(req.body);

    const result = await confirmEmergencyQueueChange({
      queueId: data.queueId,
      staffUserId: req.user!.userId,
      reason: data.reason,
      proposedDelayMins: data.proposedDelayMins,
      emergencyToken: data.emergencyToken,
    });

    res.status(201).json({
      success: true,
      message: 'Emergency priority successfully authorized, applied to live queue, and affected patients notified.',
      event: result.emergencyEvent,
      queueEntry: result.newEntry,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/emergencies/history - Audit history of emergency events
router.get('/history', authenticate, authorize(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), async (req, res, next) => {
  try {
    const events = await prisma.emergencyQueueEvent.findMany({
      include: {
        reportedByStaff: { select: { fullName: true, email: true, role: true } },
        queue: {
          include: { department: true, doctor: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
});

export default router;
