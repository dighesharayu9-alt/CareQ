import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma/client.js';
import { signToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Helper to set secure auth cookie
function setAuthCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register (PATIENTS ONLY)
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    // Create User and Patient record in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: validated.fullName,
          email: validated.email.toLowerCase(),
          phone: validated.phone || null,
          passwordHash,
          role: 'PATIENT', // Always force PATIENT for public registration
          status: 'ACTIVE',
        },
      });

      const patient = await tx.patient.create({
        data: {
          userId: user.id,
        },
      });

      return { ...user, patientId: patient.id };
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      patientId: newUser.patientId,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        patientId: newUser.patientId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended or inactive. Please contact hospital administration.',
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      patientId: user.patient?.id,
      doctorId: user.doctor?.id,
    });

    setAuthCookie(res, token);

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        patientId: user.patient?.id,
        doctorId: user.doctor?.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: {
        patient: true,
        doctor: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        patient: user.patient,
        doctor: user.doctor,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
