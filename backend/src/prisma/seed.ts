import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const DEMO_PASSWORD = 'CareQ@2025';

export async function seed() {
  console.log('--- Seeding CareQ Hospital Database ---');

  // Clear existing records in proper dependency order
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.queueTransferEvent.deleteMany({});
  await prisma.delayEvent.deleteMany({});
  await prisma.emergencyQueueEvent.deleteMany({});
  await prisma.consultation.deleteMany({});
  await prisma.queueEntry.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctorAvailability.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create Core Users
  console.log('Creating demo users...');

  // Admin User
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'System Administrator (Demo)',
      email: 'admin@careq.demo',
      phone: '+91 98765 00001',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Receptionist User
  const receptionUser = await prisma.user.create({
    data: {
      fullName: 'Sarah Jenkins (Reception Desk)',
      email: 'reception@careq.demo',
      phone: '+91 98765 00002',
      passwordHash,
      role: 'RECEPTIONIST',
      status: 'ACTIVE',
    },
  });

  // Doctor 1: Dr. Rajesh Sharma (Cardiology)
  const docUser1 = await prisma.user.create({
    data: {
      fullName: 'Dr. Rajesh Sharma, MD',
      email: 'doctor@careq.demo',
      phone: '+91 98765 00003',
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  // Doctor 2: Dr. Anita Deshmukh (Orthopedics)
  const docUser2 = await prisma.user.create({
    data: {
      fullName: 'Dr. Anita Deshmukh, MS',
      email: 'ortho.doc@careq.demo',
      phone: '+91 98765 00004',
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  // Doctor 3: Dr. Priya Mehta (ENT)
  const docUser3 = await prisma.user.create({
    data: {
      fullName: 'Dr. Priya Mehta, DNB',
      email: 'ent.doc@careq.demo',
      phone: '+91 98765 00005',
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  // Doctor 4: Dr. Sunita Rao (General Medicine)
  const docUser4 = await prisma.user.create({
    data: {
      fullName: 'Dr. Sunita Rao, MD',
      email: 'gen.doc@careq.demo',
      phone: '+91 98765 00006',
      passwordHash,
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  // Primary Demo Patient
  const patientUser = await prisma.user.create({
    data: {
      fullName: 'Ramesh Kumar',
      email: 'patient@careq.demo',
      phone: '+91 98765 11111',
      passwordHash,
      role: 'PATIENT',
      status: 'ACTIVE',
    },
  });

  const patientProfile1 = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      dob: new Date('1982-04-15'),
      gender: 'Male',
      bloodGroup: 'B+',
      emergencyContact: '+91 98765 99991',
      address: 'Flat 402, Green Glen Layout, Bangalore',
    },
  });

  // Additional Patients
  const patientData = [
    { name: 'Sita Devi', email: 'sita.devi@careq.demo', phone: '+91 98765 11112', gender: 'Female', bg: 'O+' },
    { name: 'Aman Singh', email: 'aman.singh@careq.demo', phone: '+91 98765 11113', gender: 'Male', bg: 'A+' },
    { name: 'Vikram Malhotra', email: 'vikram.m@careq.demo', phone: '+91 98765 11114', gender: 'Male', bg: 'AB+' },
    { name: 'Ananya Sen', email: 'ananya.sen@careq.demo', phone: '+91 98765 11115', gender: 'Female', bg: 'B-' },
    { name: 'Kavita Nair', email: 'kavita.n@careq.demo', phone: '+91 98765 11116', gender: 'Female', bg: 'O-' },
  ];

  const additionalPatients = [];
  for (const p of patientData) {
    const u = await prisma.user.create({
      data: {
        fullName: p.name,
        email: p.email,
        phone: p.phone,
        passwordHash,
        role: 'PATIENT',
        status: 'ACTIVE',
      },
    });
    const profile = await prisma.patient.create({
      data: {
        userId: u.id,
        gender: p.gender,
        bloodGroup: p.bg,
        emergencyContact: '+91 98765 00000',
        address: 'Bangalore, India',
      },
    });
    additionalPatients.push({ user: u, profile });
  }

  // 2. Create Departments
  console.log('Creating departments...');
  const deptCardio = await prisma.department.create({
    data: {
      name: 'Cardiology',
      code: 'CARD',
      description: 'Comprehensive adult & pediatric heart care and diagnostics',
      avgConsultationMins: 20,
      active: true,
    },
  });

  const deptOrtho = await prisma.department.create({
    data: {
      name: 'Orthopedics',
      code: 'ORTH',
      description: 'Bone, joint, trauma and sports medicine clinic',
      avgConsultationMins: 15,
      active: true,
    },
  });

  const deptENT = await prisma.department.create({
    data: {
      name: 'Ear, Nose & Throat (ENT)',
      code: 'ENT',
      description: 'Advanced sinus, hearing, and throat evaluations',
      avgConsultationMins: 12,
      active: true,
    },
  });

  const deptGeneral = await prisma.department.create({
    data: {
      name: 'General Medicine',
      code: 'GEN',
      description: 'Primary triage, internal medicine, and acute care',
      avgConsultationMins: 10,
      active: true,
    },
  });

  // 3. Create Doctors
  console.log('Creating doctors and availability...');
  const doctor1 = await prisma.doctor.create({
    data: {
      userId: docUser1.id,
      departmentId: deptCardio.id,
      specialization: 'Senior Consultant Interventional Cardiologist',
      roomNumber: 'OPD 101',
      consultationFee: 800.0,
      status: 'AVAILABLE',
      currentDelayMins: 0,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: docUser2.id,
      departmentId: deptOrtho.id,
      specialization: 'Joint Replacement & Spine Specialist',
      roomNumber: 'OPD 108',
      consultationFee: 700.0,
      status: 'AVAILABLE',
      currentDelayMins: 0,
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      userId: docUser3.id,
      departmentId: deptENT.id,
      specialization: 'ENT Surgeon & Allergist',
      roomNumber: 'OPD 204',
      consultationFee: 600.0,
      status: 'IN_CONSULTATION',
      currentDelayMins: 0,
    },
  });

  const doctor4 = await prisma.doctor.create({
    data: {
      userId: docUser4.id,
      departmentId: deptGeneral.id,
      specialization: 'Physician & Diabetologist',
      roomNumber: 'OPD 102',
      consultationFee: 500.0,
      status: 'AVAILABLE',
      currentDelayMins: 0,
    },
  });

  // Create Availabilities for Doctors (Mon - Sat)
  const doctors = [doctor1, doctor2, doctor3, doctor4];
  for (const doc of doctors) {
    for (let day = 1; day <= 6; day++) {
      await prisma.doctorAvailability.create({
        data: {
          doctorId: doc.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMins: 15,
          active: true,
        },
      });
    }
  }

  // 4. Create Today's Queues
  console.log("Setting up today's queues and appointments...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queueCardio = await prisma.queue.create({
    data: {
      departmentId: deptCardio.id,
      doctorId: doctor1.id,
      date: today,
      status: 'ACTIVE',
    },
  });

  const queueOrtho = await prisma.queue.create({
    data: {
      departmentId: deptOrtho.id,
      doctorId: doctor2.id,
      date: today,
      status: 'ACTIVE',
    },
  });

  const queueENT = await prisma.queue.create({
    data: {
      departmentId: deptENT.id,
      doctorId: doctor3.id,
      date: today,
      status: 'ACTIVE',
    },
  });

  const queueGen = await prisma.queue.create({
    data: {
      departmentId: deptGeneral.id,
      doctorId: doctor4.id,
      date: today,
      status: 'ACTIVE',
    },
  });

  // 5. Seed Realistic Appointments & Live Queue Entries
  // Cardiology Queue:
  // Patient Ramesh Kumar (Demo Patient) -> CARD-015, Waiting
  // Sita Devi -> CARD-016, Waiting
  // Vikram Malhotra -> CARD-014, In Consultation
  // Ananya Sen -> CARD-013, Completed

  const apptCompleted = await prisma.appointment.create({
    data: {
      appointmentDate: today,
      appointmentTime: '09:00',
      tokenNumber: 'CARD-013',
      patientId: additionalPatients[3].profile.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      status: 'COMPLETED',
      symptoms: 'Follow-up for hypertension',
    },
  });

  const entryCompleted = await prisma.queueEntry.create({
    data: {
      queueId: queueCardio.id,
      appointmentId: apptCompleted.id,
      patientId: additionalPatients[3].profile.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      tokenNumber: 'CARD-013',
      sequenceNumber: 1,
      status: 'COMPLETED',
      estimatedWaitMins: 0,
      actualWaitMins: 14,
      calledAt: new Date(Date.now() - 40 * 60 * 1000),
      consultationStartedAt: new Date(Date.now() - 35 * 60 * 1000),
      consultationEndedAt: new Date(Date.now() - 15 * 60 * 1000),
    },
  });

  await prisma.consultation.create({
    data: {
      queueEntryId: entryCompleted.id,
      doctorId: doctor1.id,
      patientId: additionalPatients[3].profile.id,
      diagnosis: 'Stage 1 Hypertension - Well Controlled',
      prescription: 'Amlodipine 5mg OD, Low sodium diet',
      operationalNotes: 'Patient advised to review in 3 months',
      startedAt: new Date(Date.now() - 35 * 60 * 1000),
      endedAt: new Date(Date.now() - 15 * 60 * 1000),
      durationMins: 20,
    },
  });

  // Current In Consultation: Vikram Malhotra
  const apptInConsultation = await prisma.appointment.create({
    data: {
      appointmentDate: today,
      appointmentTime: '09:30',
      tokenNumber: 'CARD-014',
      patientId: additionalPatients[2].profile.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      status: 'CONFIRMED',
      symptoms: 'Mild chest discomfort during exertion',
    },
  });

  const entryInConsultation = await prisma.queueEntry.create({
    data: {
      queueId: queueCardio.id,
      appointmentId: apptInConsultation.id,
      patientId: additionalPatients[2].profile.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      tokenNumber: 'CARD-014',
      sequenceNumber: 2,
      status: 'IN_CONSULTATION',
      estimatedWaitMins: 0,
      actualWaitMins: 22,
      calledAt: new Date(Date.now() - 15 * 60 * 1000),
      consultationStartedAt: new Date(Date.now() - 12 * 60 * 1000),
    },
  });

  // Demo Patient: Ramesh Kumar (CARD-015) -> Position 1 Waiting (Wait ≈ 15-20 min)
  const apptDemoPatient = await prisma.appointment.create({
    data: {
      appointmentDate: today,
      appointmentTime: '10:00',
      tokenNumber: 'CARD-015',
      patientId: patientProfile1.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      status: 'CONFIRMED',
      symptoms: 'Routine ECG review and palpitations',
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: queueCardio.id,
      appointmentId: apptDemoPatient.id,
      patientId: patientProfile1.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      tokenNumber: 'CARD-015',
      sequenceNumber: 3,
      status: 'WAITING',
      estimatedWaitMins: 20,
    },
  });

  // Sita Devi: CARD-016 -> Position 2 Waiting (Wait ≈ 40 min)
  const apptSita = await prisma.appointment.create({
    data: {
      appointmentDate: today,
      appointmentTime: '10:30',
      tokenNumber: 'CARD-016',
      patientId: additionalPatients[0].profile.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      status: 'CONFIRMED',
      symptoms: 'Shortness of breath on climbing stairs',
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: queueCardio.id,
      appointmentId: apptSita.id,
      patientId: additionalPatients[0].profile.id,
      doctorId: doctor1.id,
      departmentId: deptCardio.id,
      tokenNumber: 'CARD-016',
      sequenceNumber: 4,
      status: 'WAITING',
      estimatedWaitMins: 40,
    },
  });

  // Orthopedics: Aman Singh -> ORTH-008, CALLED
  const apptAman = await prisma.appointment.create({
    data: {
      appointmentDate: today,
      appointmentTime: '09:45',
      tokenNumber: 'ORTH-008',
      patientId: additionalPatients[1].profile.id,
      doctorId: doctor2.id,
      departmentId: deptOrtho.id,
      status: 'CONFIRMED',
      symptoms: 'Knee joint pain after running',
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: queueOrtho.id,
      appointmentId: apptAman.id,
      patientId: additionalPatients[1].profile.id,
      doctorId: doctor2.id,
      departmentId: deptOrtho.id,
      tokenNumber: 'ORTH-008',
      sequenceNumber: 1,
      status: 'CALLED',
      calledAt: new Date(Date.now() - 2 * 60 * 1000),
      estimatedWaitMins: 0,
    },
  });

  // Kavita Nair in ENT -> ENT-006, IN_CONSULTATION
  const apptKavita = await prisma.appointment.create({
    data: {
      appointmentDate: today,
      appointmentTime: '09:30',
      tokenNumber: 'ENT-006',
      patientId: additionalPatients[4].profile.id,
      doctorId: doctor3.id,
      departmentId: deptENT.id,
      status: 'CONFIRMED',
      symptoms: 'Persistent throat infection and voice hoarseness',
    },
  });

  await prisma.queueEntry.create({
    data: {
      queueId: queueENT.id,
      appointmentId: apptKavita.id,
      patientId: additionalPatients[4].profile.id,
      doctorId: doctor3.id,
      departmentId: deptENT.id,
      tokenNumber: 'ENT-006',
      sequenceNumber: 1,
      status: 'IN_CONSULTATION',
      consultationStartedAt: new Date(Date.now() - 5 * 60 * 1000),
      estimatedWaitMins: 0,
    },
  });

  // Notifications
  await prisma.notification.create({
    data: {
      userId: patientUser.id,
      title: 'Appointment Confirmed & Token Generated',
      message: 'Your Cardiology appointment is confirmed. Token: CARD-015. Please arrive 15 minutes before your estimated time.',
      type: 'APPOINTMENT',
      isRead: true,
      metadata: JSON.stringify({ tokenNumber: 'CARD-015', department: 'Cardiology' }),
    },
  });

  await prisma.notification.create({
    data: {
      userId: patientUser.id,
      title: 'Live Queue Position Update',
      message: 'Your token CARD-015 is now at Position 1. Doctor Dr. Rajesh Sharma is currently in consultation with token CARD-014.',
      type: 'QUEUE_UPDATE',
      isRead: false,
      metadata: JSON.stringify({ position: 1, waitMins: 20 }),
    },
  });

  // Initial Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZED',
      entityType: 'System',
      entityId: 'CareQ-Core',
      details: JSON.stringify({ message: 'Hospital initial departments and demo queues successfully configured' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: receptionUser.id,
      action: 'WALK_IN_REGISTRATION',
      entityType: 'Appointment',
      entityId: apptDemoPatient.id,
      details: JSON.stringify({ token: 'CARD-015', patient: 'Ramesh Kumar', department: 'Cardiology' }),
    },
  });

  console.log('--- CareQ Database Seeding Completed Successfully! ---');
  console.log(`Demo Credentials:`);
  console.log(`- Admin:        admin@careq.demo      / ${DEMO_PASSWORD}`);
  console.log(`- Doctor:       doctor@careq.demo     / ${DEMO_PASSWORD}`);
  console.log(`- Receptionist: reception@careq.demo  / ${DEMO_PASSWORD}`);
  console.log(`- Patient:      patient@careq.demo    / ${DEMO_PASSWORD}`);
}

// Only execute if called directly as main script
const isMain = process.argv[1] && (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));
if (isMain) {
  seed()
    .catch((e) => {
      console.error('Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
