import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server.js';
import { DEMO_PASSWORD } from '../prisma/seed.js';

const { app } = createServer();

describe('CareQ API & Queue Management Suite', () => {
  let patientToken = '';
  let receptionistToken = '';
  let doctorToken = '';
  let adminToken = '';
  let cardioDeptId = '';
  let doctorId = '';
  let testQueueId = '';

  beforeAll(async () => {
    // 1. Login as Patient
    const pRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'patient@careq.demo', password: DEMO_PASSWORD });
    expect(pRes.status).toBe(200);
    patientToken = pRes.body.token;

    // 2. Login as Receptionist
    const rRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reception@careq.demo', password: DEMO_PASSWORD });
    expect(rRes.status).toBe(200);
    receptionistToken = rRes.body.token;

    // 3. Login as Doctor
    const dRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'doctor@careq.demo', password: DEMO_PASSWORD });
    expect(dRes.status).toBe(200);
    doctorToken = dRes.body.token;

    // 4. Login as Admin
    const aRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@careq.demo', password: DEMO_PASSWORD });
    expect(aRes.status).toBe(200);
    adminToken = aRes.body.token;

    // Get Cardiology department and doctor
    const deptRes = await request(app).get('/api/departments');
    const cardio = deptRes.body.departments.find((d: any) => d.code === 'CARD');
    cardioDeptId = cardio.id;

    const docRes = await request(app).get(`/api/doctors?departmentId=${cardioDeptId}`);
    doctorId = docRes.body.doctors[0].id;
  });

  it('verifies /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('rejects registration with duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Duplicate Test',
      email: 'patient@careq.demo',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('enforces role-based authorization: patients cannot create departments', async () => {
    const res = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Unauthorized Dept',
        code: 'UNAUTH',
      });
    expect(res.status).toBe(403);
  });

  it('allows patients to fetch their live dashboard status & active token', async () => {
    const res = await request(app)
      .get('/api/patients/me')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.patient.fullName).toBe('Ramesh Kumar');
    expect(res.body.patient.activeQueue).toBeDefined();
    expect(res.body.patient.activeQueue.tokenNumber).toBe('CARD-015');
  });

  it('books an appointment and generates a unique token', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        departmentId: cardioDeptId,
        doctorId: doctorId,
        appointmentDate: today,
        appointmentTime: '11:30',
        symptoms: 'Checkup',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.appointment.tokenNumber).toMatch(/^CARD-\d{3}$/);
    testQueueId = res.body.queueEntry?.queueId;
  });

  it('fetches live department queue with waiting and in-consultation counts', async () => {
    const res = await request(app).get(`/api/queues/department/${cardioDeptId}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.totalWaiting).toBeGreaterThan(0);
    if (!testQueueId && res.body.queues.length > 0) {
      testQueueId = res.body.queues[0].id;
    }
  });

  it('computes Emergency Impact Preview showing affected patients before confirmation', async () => {
    expect(testQueueId).toBeTruthy();

    const res = await request(app)
      .get(`/api/emergencies/preview?queueId=${testQueueId}&proposedDelayMins=20`)
      .set('Authorization', `Bearer ${receptionistToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.preview.affectedPatientsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.preview.proposedDelayMins).toBe(20);
    expect(res.body.preview.affectedPatients[0].revisedEstimateMins).toBe(
      res.body.preview.affectedPatients[0].previousEstimateMins + 20
    );
  });

  it('confirms emergency queue override in transaction and updates live queue', async () => {
    const res = await request(app)
      .post('/api/emergencies/confirm')
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({
        queueId: testQueueId,
        reason: 'Acute Coronary Syndrome — Immediate Resuscitation',
        proposedDelayMins: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.queueEntry.isEmergency).toBe(true);
    expect(res.body.queueEntry.priority).toBe(100);
  });

  it('handles doctor delay reporting and recalculates queue estimates', async () => {
    const res = await request(app)
      .post('/api/delays')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        doctorId: doctorId,
        delayMinutes: 25,
        reason: 'Extended consultation',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.delayEvent.delayMinutes).toBe(25);
  });

  it('provides public live queue display with Now Serving and Next tokens', async () => {
    const res = await request(app).get(`/api/queues/public/${cardioDeptId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.nowServing).toBeDefined();
    expect(res.body.nextUp).toBeDefined();
  });

  it('retrieves persistent notifications for the patient', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.notifications.length).toBeGreaterThan(0);
  });

  it('fetches hospital analytics KPIs, workload, and delay causes', async () => {
    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.kpis.totalPatients).toBeGreaterThan(0);
    expect(res.body.departmentWorkload.length).toBeGreaterThan(0);
    expect(res.body.delayCausesData.length).toBeGreaterThan(0);
  });
});
