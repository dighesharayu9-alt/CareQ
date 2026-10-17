import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { logAudit } from '../services/auditService.js';
import { emitToDepartment, emitToDoctor } from '../services/socketService.js';

const router = Router();

// GET /api/doctors - Public or Authenticated
router.get('/', async (req, res, next) => {
  try {
    const { departmentId } = req.query;

    const doctors = await prisma.doctor.findMany({
      where: {
        ...(departmentId ? { departmentId: String(departmentId) } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        department: true,
        availabilities: true,
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    res.json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        department: true,
        availabilities: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    res.json({ success: true, doctor });
  } catch (error) {
    next(error);
  }
});

// PUT /api/doctors/:id/status - Update Doctor Status
router.put('/:id/status', authenticate, authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { status, delayReason } = req.body;

    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data: {
        status,
        delayReason: delayReason || null,
        currentDelayMins: status === 'AVAILABLE' ? 0 : undefined,
      },
      include: { user: true, department: true },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'UPDATE_DOCTOR_STATUS',
      entityType: 'Doctor',
      entityId: doctor.id,
      details: { status, doctorName: doctor.user.fullName },
    });

    emitToDepartment(doctor.departmentId, 'doctor:status_changed', {
      doctorId: doctor.id,
      status,
      delayReason,
    });
    emitToDoctor(doctor.id, 'doctor:status_changed', { status });

    res.json({ success: true, doctor });
  } catch (error) {
    next(error);
  }
});

export default router;
