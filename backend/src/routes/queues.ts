import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { callNextPatient, recalculateQueueEstimates } from '../services/queueEngine.js';
import { emitToDepartment, emitToDoctor, emitToAll } from '../services/socketService.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

// GET /api/queues/department/:deptId - Department live queue
router.get('/department/:deptId', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const department = await prisma.department.findUnique({
      where: { id: req.params.deptId },
      include: {
        queues: {
          where: { status: 'ACTIVE' },
          include: {
            doctor: { include: { user: true } },
            entries: {
              include: {
                patient: { include: { user: { select: { fullName: true, phone: true } } } },
                doctor: { include: { user: { select: { fullName: true } } } },
              },
              orderBy: [{ priority: 'desc' }, { sequenceNumber: 'asc' }],
            },
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const allEntries = department.queues.flatMap((q) => q.entries);

    const waiting = allEntries.filter((e) => e.status === 'WAITING');
    const called = allEntries.filter((e) => e.status === 'CALLED');
    const inConsultation = allEntries.filter((e) => e.status === 'IN_CONSULTATION');
    const completed = allEntries.filter((e) => e.status === 'COMPLETED');

    res.json({
      success: true,
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        avgConsultationMins: department.avgConsultationMins,
      },
      queues: department.queues,
      summary: {
        totalWaiting: waiting.length,
        totalCalled: called.length,
        totalInConsultation: inConsultation.length,
        totalCompleted: completed.length,
      },
      waiting,
      called,
      inConsultation,
      completed,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/queues/doctor/:doctorId - Doctor's specific queue
router.get('/doctor/:doctorId', authenticate, authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req, res, next) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.doctorId },
      include: {
        user: true,
        department: true,
        queues: {
          where: { status: 'ACTIVE' },
          include: {
            entries: {
              include: {
                patient: { include: { user: { select: { fullName: true, phone: true } } } },
                appointment: true,
              },
              orderBy: [{ priority: 'desc' }, { sequenceNumber: 'asc' }],
            },
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const entries = doctor.queues.flatMap((q) => q.entries);

    res.json({
      success: true,
      doctor: {
        id: doctor.id,
        name: doctor.user.fullName,
        department: doctor.department.name,
        roomNumber: doctor.roomNumber,
        status: doctor.status,
        currentDelayMins: doctor.currentDelayMins,
        delayReason: doctor.delayReason,
      },
      queueId: doctor.queues[0]?.id || null,
      entries,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/queues/public/:deptId - Public Live Display View (hospital waiting room display)
router.get('/public/:deptId', async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.deptId },
      include: {
        queues: {
          where: { status: 'ACTIVE' },
          include: {
            doctor: { include: { user: true } },
            entries: {
              where: { status: { in: ['CALLED', 'IN_CONSULTATION', 'WAITING'] } },
              include: {
                doctor: { include: { user: true } },
              },
              orderBy: [{ priority: 'desc' }, { sequenceNumber: 'asc' }],
            },
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const allEntries = department.queues.flatMap((q) => q.entries);

    // Now Serving: entries currently CALLED or IN_CONSULTATION
    const nowServing = allEntries
      .filter((e) => e.status === 'CALLED' || e.status === 'IN_CONSULTATION')
      .map((e) => ({
        tokenNumber: e.tokenNumber,
        roomNumber: e.doctor.roomNumber,
        doctorName: `Dr. ${e.doctor.user.fullName}`,
        status: e.status,
        isEmergency: e.isEmergency,
      }));

    // Next Up: next 6 WAITING tokens
    const nextUp = allEntries
      .filter((e) => e.status === 'WAITING')
      .slice(0, 8)
      .map((e) => ({
        tokenNumber: e.tokenNumber,
        estimatedWaitMins: e.estimatedWaitMins,
        roomNumber: e.doctor.roomNumber,
      }));

    res.json({
      success: true,
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
      },
      nowServing,
      nextUp,
      lastUpdated: new Date(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/queues/call-next - Call next patient in queue
router.post('/call-next', authenticate, authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { queueId, doctorId } = req.body;

    if (!queueId || !doctorId) {
      return res.status(400).json({ success: false, message: 'queueId and doctorId are required' });
    }

    const calledEntry = await callNextPatient({
      queueId,
      doctorId,
      staffUserId: req.user!.userId,
    });

    // Recalculate remaining waiting estimates
    await recalculateQueueEstimates(queueId);

    res.json({
      success: true,
      message: `Token ${calledEntry.tokenNumber} called for Room ${calledEntry.doctor.roomNumber}.`,
      calledEntry,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/queues/start-consultation
router.post('/start-consultation', authenticate, authorize(['DOCTOR', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { queueEntryId } = req.body;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    const updated = await prisma.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: 'IN_CONSULTATION',
        consultationStartedAt: new Date(),
      },
    });

    // Set doctor status to IN_CONSULTATION
    await prisma.doctor.update({
      where: { id: entry.doctorId },
      data: { status: 'IN_CONSULTATION' },
    });

    await recalculateQueueEstimates(entry.queueId);

    await logAudit({
      userId: req.user!.userId,
      action: 'START_CONSULTATION',
      entityType: 'QueueEntry',
      entityId: entry.id,
      details: { tokenNumber: entry.tokenNumber, doctor: entry.doctor.user.fullName },
    });

    res.json({ success: true, message: 'Consultation started', entry: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/queues/complete-consultation
router.post('/complete-consultation', authenticate, authorize(['DOCTOR', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { queueEntryId, diagnosis, prescription, operationalNotes } = req.body;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: { doctor: { include: { user: true } }, patient: { include: { user: true } } },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    const endTime = new Date();
    const startTime = entry.consultationStartedAt || entry.calledAt || new Date(Date.now() - 15 * 60 * 1000);
    const durationMins = Math.max(1, Math.round((endTime.getTime() - new Date(startTime).getTime()) / (1000 * 60)));

    const result = await prisma.$transaction(async (tx) => {
      const completedEntry = await tx.queueEntry.update({
        where: { id: queueEntryId },
        data: {
          status: 'COMPLETED',
          consultationEndedAt: endTime,
        },
      });

      if (entry.appointmentId) {
        await tx.appointment.update({
          where: { id: entry.appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      const consultation = await tx.consultation.create({
        data: {
          queueEntryId: entry.id,
          doctorId: entry.doctorId,
          patientId: entry.patientId,
          diagnosis: diagnosis || 'General checkup completed',
          prescription: prescription || null,
          operationalNotes: operationalNotes || null,
          startedAt: startTime,
          endedAt: endTime,
          durationMins,
        },
      });

      // Doctor is back to AVAILABLE
      await tx.doctor.update({
        where: { id: entry.doctorId },
        data: { status: 'AVAILABLE' },
      });

      return { completedEntry, consultation };
    });

    await recalculateQueueEstimates(entry.queueId);

    await createNotification({
      userId: entry.patient.user.id,
      title: 'Consultation Completed',
      message: `Your consultation for token ${entry.tokenNumber} with Dr. ${entry.doctor.user.fullName} is completed. Thank you for visiting CareQ.`,
      type: 'GENERAL',
      metadata: { tokenNumber: entry.tokenNumber },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'COMPLETE_CONSULTATION',
      entityType: 'QueueEntry',
      entityId: entry.id,
      details: { tokenNumber: entry.tokenNumber, durationMins },
    });

    res.json({
      success: true,
      message: 'Consultation completed successfully.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/queues/mark-no-show
router.post('/mark-no-show', authenticate, authorize(['DOCTOR', 'RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const { queueEntryId, reason } = req.body;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: queueEntryId },
      include: { patient: { include: { user: true } } },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    const updated = await prisma.queueEntry.update({
      where: { id: queueEntryId },
      data: {
        status: 'NO_SHOW',
        notes: reason || 'Patient did not respond when called',
      },
    });

    await recalculateQueueEstimates(entry.queueId);

    await logAudit({
      userId: req.user!.userId,
      action: 'MARK_NO_SHOW',
      entityType: 'QueueEntry',
      entityId: entry.id,
      details: { tokenNumber: entry.tokenNumber, reason },
    });

    res.json({ success: true, message: 'Patient marked as No-Show', entry: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
