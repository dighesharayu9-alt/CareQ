import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
});

// GET /api/patients/me - Get current logged-in patient profile & live status
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        patient: {
          include: {
            appointments: {
              orderBy: { appointmentDate: 'desc' },
              take: 5,
              include: {
                doctor: { include: { user: true } },
                department: true,
                queueEntry: true,
              },
            },
            queueEntries: {
              where: {
                status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
              },
              include: {
                doctor: { include: { user: true } },
                department: true,
                queue: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user || !user.patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const activeQueueEntry = user.patient.queueEntries[0] || null;

    let patientsAhead = 0;
    if (activeQueueEntry && activeQueueEntry.status === 'WAITING') {
      patientsAhead = await prisma.queueEntry.count({
        where: {
          queueId: activeQueueEntry.queueId,
          status: 'WAITING',
          sequenceNumber: { lt: activeQueueEntry.sequenceNumber },
        },
      });
    }

    res.json({
      success: true,
      patient: {
        id: user.patient.id,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dob: user.patient.dob,
        gender: user.patient.gender,
        bloodGroup: user.patient.bloodGroup,
        emergencyContact: user.patient.emergencyContact,
        address: user.patient.address,
        activeQueue: activeQueueEntry
          ? {
              ...activeQueueEntry,
              patientsAhead,
            }
          : null,
        recentAppointments: user.patient.appointments,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/patients/me - Update profile
router.put('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { patient: true },
    });

    if (!user || !user.patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    // Update user
    if (data.fullName || data.phone) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: data.fullName || undefined,
          phone: data.phone || undefined,
        },
      });
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: user.patient.id },
      data: {
        dob: data.dob ? new Date(data.dob) : undefined,
        gender: data.gender || undefined,
        bloodGroup: data.bloodGroup || undefined,
        emergencyContact: data.emergencyContact || undefined,
        address: data.address || undefined,
      },
      include: { user: true },
    });

    res.json({ success: true, patient: updatedPatient });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients/history - Patient consultation history
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { patient: true },
    });

    if (!user || !user.patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: user.patient.id },
      include: {
        doctor: { include: { user: true } },
        department: true,
        queueEntry: {
          include: { consultation: true },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
});

// GET /api/patients - Staff search
router.get('/', authenticate, authorize(['RECEPTIONIST', 'DOCTOR', 'ADMIN']), async (req, res, next) => {
  try {
    const { query } = req.query;

    const patients = await prisma.patient.findMany({
      where: query
        ? {
            user: {
              OR: [
                { fullName: { contains: String(query) } },
                { email: { contains: String(query) } },
                { phone: { contains: String(query) } },
              ],
            },
          }
        : {},
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, patients });
  } catch (error) {
    next(error);
  }
});

export default router;
