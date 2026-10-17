import { Request } from 'express';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type DoctorStatus =
  | 'AVAILABLE'
  | 'IN_CONSULTATION'
  | 'ON_BREAK'
  | 'DELAYED'
  | 'OFF_DUTY';

export type AppointmentStatus =
  | 'BOOKED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export type QueueEntryStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export type NotificationType =
  | 'QUEUE_UPDATE'
  | 'DELAY'
  | 'EMERGENCY'
  | 'TURN_APPROACHING'
  | 'APPOINTMENT'
  | 'GENERAL';

export interface AuthUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
  patientId?: string;
  doctorId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
}
