import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { reportDoctorDelay, recalculateQueueEstimates } from '../services/queueEngine.js';
import { emitToDepartment, emitToDoctor } from '../services/socketService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const reportDelaySchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  delayMinutes: z.number().int().min(5).max(300, 'Delay minutes must be between 5 and 300'),
  reason: z.enum([
    'Extended consultation',
    'Doctor unavailable',
    'Emergency case',
    'Department overload',
    'Other operational delay',
  ]),
  expectedReturnTime: z.string().optional(),
});

// POST /api/delays - Report Doctor Delay
router.post('/', authenticate, authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = reportDelaySchema.parse(req.body);

    const delayEvent = await reportDoctorDelay({
      doctorId: data.doctorId,
      delayMinutes: data.delayMinutes,
      reason: data.reason,
      expectedReturnTime: data.expectedReturnTime ? new Date(data.expectedReturnTime) : undefined,
      reportedByUserId: req.user!.userId,
    });

    res.status(201).json({
      success: true,
      message: `Delay of ${data.delayMinutes} mins recorded. Affected patients have been notified with revised estimates.`,
      delayEvent,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/delays/active - Get all active delays
router.get('/active', async (req, res, next) => {
  try {
    const doctorsWithDelay = await prisma.doctor.findMany({
      where: { currentDelayMins: { gt: 0 } },
      include: {
        user: { select: { fullName: true, email: true } },
        department: true,
      },
    });

    res.json({ success: true, activeDelays: doctorsWithDelay });
  } catch (error) {
    next(error);
  }
});

// POST /api/delays/:doctorId/resolve - Clear delay and set doctor to AVAILABLE
router.post('/:doctorId/resolve', authenticate, authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        currentDelayMins: 0,
        delayReason: null,
        status: 'AVAILABLE',
      },
      include: { department: true, user: true },
    });

    // Mark active delay events as resolved
    await prisma.delayEvent.updateMany({
      where: { doctorId, resolvedAt: null },
      data: { resolvedAt: new Date() },
    });

    // Recalculate queues
    const queues = await prisma.queue.findMany({
      where: { doctorId, status: 'ACTIVE' },
    });
    for (const q of queues) {
      await recalculateQueueEstimates(q.id);
    }

    await logAudit({
      userId: req.user!.userId,
      action: 'RESOLVE_DOCTOR_DELAY',
      entityType: 'Doctor',
      entityId: doctorId,
      details: { doctorName: doctor.user.fullName },
    });

    emitToDepartment(doctor.departmentId, 'doctor:delay_resolved', { doctorId });
    emitToDoctor(doctorId, 'doctor:delay_resolved', {});

    res.json({ success: true, message: 'Doctor delay cleared and status set to Available.', doctor });
  } catch (error) {
    next(error);
  }
});

export default router;
