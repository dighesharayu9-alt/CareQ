import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().min(2).max(6, 'Code must be between 2 and 6 characters (e.g. CARD)'),
  description: z.string().optional(),
  avgConsultationMins: z.number().int().min(5).max(120).default(15),
  active: z.boolean().default(true),
});

// GET /api/departments - Public / Authenticated
router.get('/', async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      where: { active: true },
      include: {
        doctors: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
        queues: {
          where: { status: 'ACTIVE' },
          include: {
            entries: {
              where: { status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] } },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = departments.map((d) => {
      let waitingCount = 0;
      let inConsultationCount = 0;
      for (const q of d.queues) {
        waitingCount += q.entries.filter((e) => e.status === 'WAITING').length;
        inConsultationCount += q.entries.filter((e) => e.status === 'IN_CONSULTATION').length;
      }

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        avgConsultationMins: d.avgConsultationMins,
        active: d.active,
        doctorCount: d.doctors.length,
        waitingCount,
        inConsultationCount,
      };
    });

    res.json({ success: true, departments: formatted });
  } catch (error) {
    next(error);
  }
});

// GET /api/departments/:id
router.get('/:id', async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        doctors: {
          include: {
            user: { select: { fullName: true, email: true, phone: true } },
            availabilities: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    res.json({ success: true, department });
  } catch (error) {
    next(error);
  }
});

// POST /api/departments (ADMIN ONLY)
router.post('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = departmentSchema.parse(req.body);

    const existingCode = await prisma.department.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Department code already in use' });
    }

    const dept = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        avgConsultationMins: data.avgConsultationMins,
        active: data.active,
      },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'CREATE_DEPARTMENT',
      entityType: 'Department',
      entityId: dept.id,
      details: { name: dept.name, code: dept.code },
    });

    res.status(201).json({ success: true, department: dept });
  } catch (error) {
    next(error);
  }
});

// PUT /api/departments/:id (ADMIN ONLY)
router.put('/:id', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res, next) => {
  try {
    const data = departmentSchema.partial().parse(req.body);

    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
    });

    await logAudit({
      userId: req.user!.userId,
      action: 'UPDATE_DEPARTMENT',
      entityType: 'Department',
      entityId: dept.id,
      details: data,
    });

    res.json({ success: true, department: dept });
  } catch (error) {
    next(error);
  }
});

export default router;
