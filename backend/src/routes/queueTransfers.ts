import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { reassignDoctor, recalculateQueueEstimates } from '../services/queueEngine.js';
import { logAudit } from '../services/auditService.js';
import { emitToDepartment, emitToAll } from '../services/socketService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

const reassignDoctorSchema = z.object({
  currentDoctorId: z.string().min(1, 'Current doctor is required'),
  replacementDoctorId: z.string().min(1, 'Replacement doctor is required'),
  reason: z.string().min(3, 'Reason for reassignment is required'),
});

const transferPatientSchema = z.object({
  queueEntryId: z.string().min(1, 'Queue entry is required'),
  targetDoctorId: z.string().min(1, 'Target doctor is required'),
  reason: z.string().min(3, 'Reason is required'),
});

const mergeQueuesSchema = z.object({
  sourceQueueId: z.string().min(1, 'Source queue is required'),
  targetQueueId: z.string().min(1, 'Target queue is required'),
  reason: z.string().min(3, 'Reason is required'),
});

// POST /api/queue-transfers/reassign-doctor
router.post('/reassign-doctor', authenticate, authorize(['RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = reassignDoctorSchema.parse(req.body);

    const result = await reassignDoctor({
      currentDoctorId: data.currentDoctorId,
      replacementDoctorId: data.replacementDoctorId,
      authorizedByUserId: req.user!.userId,
      reason: data.reason,
    });

    res.json({
      success: true,
      message: 'Doctor reassignment executed successfully. All appointments and queue entries moved to the replacement doctor.',
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/queue-transfers/transfer-patient
router.post('/transfer-patient', authenticate, authorize(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = transferPatientSchema.parse(req.body);

    const entry = await prisma.queueEntry.findUnique({
      where: { id: data.queueEntryId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        department: true,
      },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    const targetDoc = await prisma.doctor.findUnique({
      where: { id: data.targetDoctorId },
      include: { user: true, department: true },
    });

    if (!targetDoc) {
      return res.status(404).json({ success: false, message: 'Target doctor not found' });
    }

    // Find or create active queue for target doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetQueue = await prisma.queue.findFirst({
      where: {
        doctorId: targetDoc.id,
        status: 'ACTIVE',
      },
    });

    if (!targetQueue) {
      targetQueue = await prisma.queue.create({
        data: {
          departmentId: targetDoc.departmentId,
          doctorId: targetDoc.id,
          date: today,
          status: 'ACTIVE',
        },
      });
    }

    // Move entry
    const maxSeq = await prisma.queueEntry.count({
      where: { queueId: targetQueue.id },
    });

    const updated = await prisma.$transaction(async (tx) => {
      const moved = await tx.queueEntry.update({
        where: { id: entry.id },
        data: {
          queueId: targetQueue!.id,
          doctorId: targetDoc.id,
          departmentId: targetDoc.departmentId,
          sequenceNumber: maxSeq + 1,
          notes: `Transferred from Dr. ${entry.doctor.user.fullName} (${entry.department.name}). Reason: ${data.reason}`,
        },
      });

      if (entry.appointmentId) {
        await tx.appointment.update({
          where: { id: entry.appointmentId },
          data: {
            doctorId: targetDoc.id,
            departmentId: targetDoc.departmentId,
          },
        });
      }

      await tx.queueTransferEvent.create({
        data: {
          sourceQueueId: entry.queueId,
          targetQueueId: targetQueue!.id,
          queueEntryId: entry.id,
          reason: data.reason,
          authorizedByUserId: req.user!.userId,
        },
      });

      return moved;
    });

    // Recalculate both source and target queues
    await recalculateQueueEstimates(entry.queueId);
    await recalculateQueueEstimates(targetQueue.id);

    await createNotification({
      userId: entry.patient.user.id,
      title: 'Consultation Queue Transferred',
      message: `Your token ${entry.tokenNumber} has been transferred to Dr. ${targetDoc.user.fullName} in ${targetDoc.department.name} (${targetDoc.roomNumber}).`,
      type: 'QUEUE_UPDATE',
      metadata: { tokenNumber: entry.tokenNumber, newDoctor: targetDoc.user.fullName },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'TRANSFER_PATIENT',
      entityType: 'QueueEntry',
      entityId: entry.id,
      details: {
        tokenNumber: entry.tokenNumber,
        fromDoctor: entry.doctor.user.fullName,
        toDoctor: targetDoc.user.fullName,
        reason: data.reason,
      },
    });

    emitToAll('queue:public_refresh', { departmentId: targetDoc.departmentId });

    res.json({
      success: true,
      message: `Patient ${entry.tokenNumber} transferred to Dr. ${targetDoc.user.fullName}.`,
      entry: updated,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/queue-transfers/merge-queues
router.post('/merge-queues', authenticate, authorize(['RECEPTIONIST', 'ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = mergeQueuesSchema.parse(req.body);

    const sourceQueue = await prisma.queue.findUnique({
      where: { id: data.sourceQueueId },
      include: {
        doctor: { include: { user: true } },
        entries: { where: { status: { in: ['WAITING', 'CALLED'] } } },
      },
    });

    const targetQueue = await prisma.queue.findUnique({
      where: { id: data.targetQueueId },
      include: { doctor: { include: { user: true } } },
    });

    if (!sourceQueue || !targetQueue) {
      return res.status(404).json({ success: false, message: 'Source or target queue not found' });
    }

    const currentTargetCount = await prisma.queueEntry.count({
      where: { queueId: targetQueue.id },
    });

    // Move all waiting entries from source to target
    await prisma.$transaction(async (tx) => {
      let offset = 1;
      for (const entry of sourceQueue.entries) {
        await tx.queueEntry.update({
          where: { id: entry.id },
          data: {
            queueId: targetQueue.id,
            doctorId: targetQueue.doctorId || entry.doctorId,
            departmentId: targetQueue.departmentId,
            sequenceNumber: currentTargetCount + offset,
            notes: `Merged from queue ${sourceQueue.id}. Reason: ${data.reason}`,
          },
        });
        offset++;
      }

      // Mark source queue as CLOSED
      await tx.queue.update({
        where: { id: sourceQueue.id },
        data: { status: 'CLOSED' },
      });
    });

    await recalculateQueueEstimates(targetQueue.id);

    await logAudit({
      userId: req.user!.userId,
      action: 'MERGE_QUEUES',
      entityType: 'Queue',
      entityId: targetQueue.id,
      details: {
        fromQueueId: sourceQueue.id,
        toQueueId: targetQueue.id,
        entriesMoved: sourceQueue.entries.length,
        reason: data.reason,
      },
    });

    emitToAll('queue:public_refresh', { departmentId: targetQueue.departmentId });

    res.json({
      success: true,
      message: `Successfully merged ${sourceQueue.entries.length} patient(s) into target queue.`,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/queue-transfers/history
router.get('/history', authenticate, authorize(['RECEPTIONIST', 'ADMIN']), async (req, res, next) => {
  try {
    const transfers = await prisma.queueTransferEvent.findMany({
      include: {
        authorizedByUser: { select: { fullName: true, role: true } },
        queueEntry: {
          include: { patient: { include: { user: { select: { fullName: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, transfers });
  } catch (error) {
    next(error);
  }
});

export default router;
