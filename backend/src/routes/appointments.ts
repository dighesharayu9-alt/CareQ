import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { recalculateQueueEstimates } from '../services/queueEngine.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const bookAppointmentSchema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  appointmentDate: z.string().min(1, 'Date is required'),
  appointmentTime: z.string().default('10:00'),
  symptoms: z.string().optional(),
  isWalkIn: z.boolean().default(false),
  // For walk-in registered by staff for another patient:
  patientId: z.string().optional(),
  walkInPatientName: z.string().optional(),
  walkInPatientPhone: z.string().optional(),
});

// Helper to generate next unique token for a department on a specific date
async function generateUniqueToken(departmentId: string, date: Date, tx: any): Promise<string> {
  const dept = await tx.department.findUnique({ where: { id: departmentId } });
  if (!dept) throw new Error('Department not found');

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await tx.appointment.count({
    where: {
      departmentId,
      appointmentDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
  });

  const nextSeq = count + 1;
  const tokenNumber = `${dept.code}-${String(nextSeq).padStart(3, '0')}`;
  return tokenNumber;
}

// POST /api/appointments - Book appointment or walk-in registration
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = bookAppointmentSchema.parse(req.body);

    let targetPatientId = req.user?.patientId;

    // If staff is registering a walk-in patient
    if (['RECEPTIONIST', 'ADMIN'].includes(req.user!.role) && data.isWalkIn) {
      if (data.patientId) {
        targetPatientId = data.patientId;
      } else if (data.walkInPatientName) {
        // Create walk-in patient profile on the fly
        const walkInEmail = `walkin.${Date.now()}@careq.internal`;
        const user = await prisma.user.create({
          data: {
            fullName: data.walkInPatientName,
            email: walkInEmail,
            phone: data.walkInPatientPhone || null,
            passwordHash: 'WALK_IN_PASS',
            role: 'PATIENT',
            status: 'ACTIVE',
          },
        });
        const patient = await prisma.patient.create({
          data: {
            userId: user.id,
            emergencyContact: data.walkInPatientPhone || 'Reception Walk-in',
          },
        });
        targetPatientId = patient.id;
      }
    }

    if (!targetPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient profile could not be identified for this booking.',
      });
    }

    const apptDate = new Date(data.appointmentDate);
    apptDate.setHours(0, 0, 0, 0);

    const now = new Date();
    const isToday =
      apptDate.getFullYear() === now.getFullYear() &&
      apptDate.getMonth() === now.getMonth() &&
      apptDate.getDate() === now.getDate();

    // Transactionally generate token, create appointment, and insert into today's queue
    const result = await prisma.$transaction(async (tx) => {
      const tokenNumber = await generateUniqueToken(data.departmentId, apptDate, tx);

      const appointment = await tx.appointment.create({
        data: {
          appointmentDate: apptDate,
          appointmentTime: data.appointmentTime,
          tokenNumber,
          patientId: targetPatientId!,
          doctorId: data.doctorId,
          departmentId: data.departmentId,
          status: 'CONFIRMED',
          isWalkIn: data.isWalkIn,
          symptoms: data.symptoms || null,
        },
        include: {
          department: true,
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
        },
      });

      let queueEntry = null;

      // If appointment is today, create active QueueEntry
      if (isToday) {
        // Find or create today's queue for this doctor/department
        let queue = await tx.queue.findFirst({
          where: {
            departmentId: data.departmentId,
            doctorId: data.doctorId,
            date: apptDate,
            status: 'ACTIVE',
          },
        });

        if (!queue) {
          queue = await tx.queue.create({
            data: {
              departmentId: data.departmentId,
              doctorId: data.doctorId,
              date: apptDate,
              status: 'ACTIVE',
            },
          });
        }

        // Sequence number in this queue
        const currentEntriesCount = await tx.queueEntry.count({
          where: { queueId: queue.id },
        });

        queueEntry = await tx.queueEntry.create({
          data: {
            queueId: queue.id,
            appointmentId: appointment.id,
            patientId: targetPatientId!,
            doctorId: data.doctorId,
            departmentId: data.departmentId,
            tokenNumber,
            sequenceNumber: currentEntriesCount + 1,
            status: 'WAITING',
            estimatedWaitMins: (currentEntriesCount + 1) * (appointment.department.avgConsultationMins || 15),
          },
        });
      }

      return { appointment, queueEntry };
    });

    // If today's queue entry was created, recalculate estimates
    if (result.queueEntry) {
      await recalculateQueueEstimates(result.queueEntry.queueId);
    }

    // Create confirmation notification
    await createNotification({
      userId: result.appointment.patient.user.id,
      title: 'Appointment Confirmed & Token Generated',
      message: `Your token ${result.appointment.tokenNumber} has been generated for ${result.appointment.department.name} with Dr. ${result.appointment.doctor.user.fullName}.`,
      type: 'APPOINTMENT',
      metadata: {
        appointmentId: result.appointment.id,
        tokenNumber: result.appointment.tokenNumber,
      },
    });

    await logAudit({
      userId: req.user!.userId,
      action: data.isWalkIn ? 'WALK_IN_REGISTRATION' : 'BOOK_APPOINTMENT',
      entityType: 'Appointment',
      entityId: result.appointment.id,
      details: {
        tokenNumber: result.appointment.tokenNumber,
        department: result.appointment.department.name,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed and digital token generated successfully.',
      appointment: result.appointment,
      queueEntry: result.queueEntry,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/appointments/token/:token - Public or Authenticated Token Lookup
router.get('/token/:token', async (req, res, next) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: { tokenNumber: req.params.token.toUpperCase() },
      include: {
        department: true,
        doctor: { include: { user: true } },
        patient: { include: { user: { select: { fullName: true } } } },
        queueEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Token not found.' });
    }

    let patientsAhead = 0;
    if (appointment.queueEntry && appointment.queueEntry.status === 'WAITING') {
      patientsAhead = await prisma.queueEntry.count({
        where: {
          queueId: appointment.queueEntry.queueId,
          status: 'WAITING',
          sequenceNumber: { lt: appointment.queueEntry.sequenceNumber },
        },
      });
    }

    res.json({
      success: true,
      appointment: {
        ...appointment,
        patientsAhead,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/appointments/:id/cancel
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { queueEntry: true, patient: { include: { user: true } } },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Role check: Only the patient themselves or staff can cancel
    if (
      req.user!.role === 'PATIENT' &&
      appointment.patient.user.id !== req.user!.userId
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({
        where: { id: appointment.id },
        data: { status: 'CANCELLED' },
      });

      if (appointment.queueEntry) {
        await tx.queueEntry.update({
          where: { id: appointment.queueEntry.id },
          data: { status: 'CANCELLED' },
        });
      }

      return appt;
    });

    if (appointment.queueEntry) {
      await recalculateQueueEstimates(appointment.queueEntry.queueId);
    }

    await createNotification({
      userId: appointment.patient.user.id,
      title: 'Appointment Cancelled',
      message: `Your appointment with token ${appointment.tokenNumber} has been cancelled.`,
      type: 'APPOINTMENT',
      metadata: { tokenNumber: appointment.tokenNumber },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'CANCEL_APPOINTMENT',
      entityType: 'Appointment',
      entityId: appointment.id,
      details: { tokenNumber: appointment.tokenNumber },
    });

    res.json({ success: true, message: 'Appointment cancelled successfully.', appointment: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
