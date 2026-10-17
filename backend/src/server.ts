import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { initSocketIO } from './services/socketService.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import doctorRoutes from './routes/doctors.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import queueRoutes from './routes/queues.js';
import emergencyRoutes from './routes/emergencies.js';
import delayRoutes from './routes/delays.js';
import queueTransferRoutes from './routes/queueTransfers.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import auditLogRoutes from './routes/auditLogs.js';

export function createServer() {
  const app = express();
  const server = http.createServer(app);

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS
  app.use(
    cors({
      origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate limiter for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 auth requests per windowMs
    message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
  });

  // Initialize Socket.IO
  initSocketIO(server, frontendUrl);

  // Healthcheck endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'CareQ Patient Queue Management System API',
      timestamp: new Date(),
    });
  });

  // Mount API Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/queues', queueRoutes);
  app.use('/api/emergencies', emergencyRoutes);
  app.use('/api/delays', delayRoutes);
  app.use('/api/queue-transfers', queueTransferRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/audit-logs', auditLogRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return { app, server };
}
