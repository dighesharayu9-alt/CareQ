import prisma from '../prisma/client.js';
import { emitToDepartment, emitToDoctor, emitToUser, emitToAll } from './socketService.js';
import { createNotification } from './notificationService.js';
import { logAudit } from './auditService.js';

export interface EmergencyImpactPatient {
  id: string;
  tokenNumber: string;
  patientName: string;
  previousEstimateMins: number;
  revisedEstimateMins: number;
  additionalDelayMins: number;
}

export interface EmergencyImpactPreviewResult {
  queueId: string;
  departmentName: string;
  doctorName: string;
  affectedPatientsCount: number;
  proposedDelayMins: number;
  affectedPatients: EmergencyImpactPatient[];
  summary: string;
}

/**
 * Core Algorithm: Recalculates estimated waiting times for all WAITING and CALLED entries in a queue.
 */
export async function recalculateQueueEstimates(queueId: string, emitUpdates = true) {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      department: true,
      doctor: true,
      entries: {
        where: {
          status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
        },
        include: {
          patient: {
            include: { user: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { sequenceNumber: 'asc' },
          { createdAt: 'asc' },
        ],
      },
    },
  });

  if (!queue) return [];

  const avgConsultation = queue.department.avgConsultationMins || 15;
  const doctorDelay = queue.doctor?.currentDelayMins || 0;

  // 1. Check if there's an active consultation
  const activeEntry = queue.entries.find((e) => e.status === 'IN_CONSULTATION');
  let remainingActiveConsultation = 0;

  if (activeEntry && activeEntry.consultationStartedAt) {
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(activeEntry.consultationStartedAt).getTime()) / (1000 * 60)
    );
    remainingActiveConsultation = Math.max(2, avgConsultation - elapsedMinutes);
  }

  // 2. Separate into waiting & called entries
  const waitingOrCalledEntries = queue.entries.filter(
    (e) => e.status === 'WAITING' || e.status === 'CALLED'
  );

  const updatedEntries = [];

  for (let i = 0; i < waitingOrCalledEntries.length; i++) {
    const entry = waitingOrCalledEntries[i];
    const previousEstimate = entry.estimatedWaitMins;

    // Wait formula:
    // If CALLED: wait is essentially 0 or 2 mins
    // If WAITING: remaining active consultation + (i * avgConsultation) + doctor delay
    let waitMins = 0;
    if (entry.status === 'CALLED') {
      waitMins = 0;
    } else {
      waitMins = remainingActiveConsultation + i * avgConsultation + doctorDelay;
    }

    // Update in database
    const updated = await prisma.queueEntry.update({
      where: { id: entry.id },
      data: {
        estimatedWaitMins: waitMins,
        sequenceNumber: i + 1,
      },
    });

    updatedEntries.push({
      entry: updated,
      previousEstimate,
      revisedEstimate: waitMins,
      patientUser: entry.patient.user,
    });

    // Notify patient if wait estimate shifted by >= 5 mins
    const diff = Math.abs(waitMins - previousEstimate);
    if (diff >= 5 && previousEstimate > 0) {
      await createNotification({
        userId: entry.patient.user.id,
        title: 'Estimated Waiting Time Updated',
        message: `Your estimated wait for token ${entry.tokenNumber} is now approximately ${waitMins} minutes (${diff > 0 && waitMins > previousEstimate ? '+' : ''}${waitMins - previousEstimate} min adjustment).`,
        type: 'QUEUE_UPDATE',
        metadata: { tokenNumber: entry.tokenNumber, estimatedWaitMins: waitMins },
      });
    }
  }

  if (emitUpdates) {
    emitToDepartment(queue.departmentId, 'queue:updated', { queueId, timestamp: new Date() });
    if (queue.doctorId) {
      emitToDoctor(queue.doctorId, 'queue:updated', { queueId, timestamp: new Date() });
    }
    emitToAll('queue:public_refresh', { departmentId: queue.departmentId });
  }

  return updatedEntries;
}

/**
 * Emergency Impact Preview:
 * Simulates insertion of an emergency case BEFORE applying changes,
 * showing the exact impact on waiting patients.
 */
export async function previewEmergencyImpact(
  queueId: string,
  proposedDelayMins = 15
): Promise<EmergencyImpactPreviewResult> {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      department: true,
      doctor: { include: { user: true } },
      entries: {
        where: { status: { in: ['WAITING', 'CALLED'] } },
        include: {
          patient: { include: { user: true } },
        },
        orderBy: [{ priority: 'desc' }, { sequenceNumber: 'asc' }],
      },
    },
  });

  if (!queue) {
    throw new Error('Queue not found for preview.');
  }

  const waitingEntries = queue.entries.filter((e) => e.status === 'WAITING');

  const affectedPatients: EmergencyImpactPatient[] = waitingEntries.map((e) => ({
    id: e.id,
    tokenNumber: e.tokenNumber,
    patientName: e.patient.user.fullName,
    previousEstimateMins: e.estimatedWaitMins,
    revisedEstimateMins: e.estimatedWaitMins + proposedDelayMins,
    additionalDelayMins: proposedDelayMins,
  }));

  return {
    queueId: queue.id,
    departmentName: queue.department.name,
    doctorName: queue.doctor?.user.fullName || 'Department Staff',
    affectedPatientsCount: affectedPatients.length,
    proposedDelayMins,
    affectedPatients,
    summary: `${affectedPatients.length} patient(s) in ${queue.department.name} will experience an estimated +${proposedDelayMins} minute operational delay due to priority emergency intervention.`,
  };
}

/**
 * Emergency Impact Confirmation:
 * Applies the emergency queue insertion inside a database transaction,
 * recalculates all estimates, emits live events, and notifies patients.
 */
export async function confirmEmergencyQueueChange(params: {
  queueId: string;
  staffUserId: string;
  reason: string;
  emergencyToken?: string;
  proposedDelayMins?: number;
}) {
  const { queueId, staffUserId, reason, proposedDelayMins = 15 } = params;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      department: true,
      doctor: true,
    },
  });

  if (!queue) {
    throw new Error('Target queue not found.');
  }

  const generatedToken =
    params.emergencyToken ||
    `EMG-${queue.department.code}-${Math.floor(100 + Math.random() * 900)}`;

  // Find or create emergency virtual patient profile for clinical queue representation
  let emergencyUser = await prisma.user.findFirst({
    where: { email: 'emergency.intake@careq.internal' },
  });

  if (!emergencyUser) {
    emergencyUser = await prisma.user.create({
      data: {
        fullName: 'Emergency Clinical Intake',
        email: 'emergency.intake@careq.internal',
        passwordHash: 'INTERNAL_ONLY_NON_LOGIN',
        role: 'PATIENT',
        status: 'ACTIVE',
      },
    });
  }

  let emergencyPatient = await prisma.patient.findUnique({
    where: { userId: emergencyUser.id },
  });

  if (!emergencyPatient) {
    emergencyPatient = await prisma.patient.create({
      data: {
        userId: emergencyUser.id,
        gender: 'Emergency',
        emergencyContact: 'Triage Desk',
      },
    });
  }

  // Transactionally record event and insert emergency queue entry
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Emergency Event Log
    const emergencyEvent = await tx.emergencyQueueEvent.create({
      data: {
        queueId: queue.id,
        emergencyToken: generatedToken,
        reason,
        reportedByStaffId: staffUserId,
        proposedDelayMins,
        affectedPatientsCount: 0,
        confirmed: true,
        appliedAt: new Date(),
      },
    });

    // 2. Insert Emergency Queue Entry with high priority (priority 100)
    const newEntry = await tx.queueEntry.create({
      data: {
        queueId: queue.id,
        patientId: emergencyPatient!.id,
        doctorId: queue.doctorId || (await tx.doctor.findFirst())!.id,
        departmentId: queue.departmentId,
        tokenNumber: generatedToken,
        sequenceNumber: 1, // High priority
        priority: 100,
        isEmergency: true,
        status: 'CALLED', // Immediately called or top of queue
        calledAt: new Date(),
        notes: `Clinical Priority Override: ${reason}`,
      },
    });

    return { emergencyEvent, newEntry };
  });

  // 3. Recalculate remaining waiting estimates
  const updatedEntries = await recalculateQueueEstimates(queue.id, false);

  // 4. Update affected count in event
  await prisma.emergencyQueueEvent.update({
    where: { id: result.emergencyEvent.id },
    data: { affectedPatientsCount: updatedEntries.length },
  });

  // 5. Notify all affected waiting patients
  for (const item of updatedEntries) {
    if (item.entry.id !== result.newEntry.id) {
      await createNotification({
        userId: item.patientUser.id,
        title: 'Priority Emergency Case In Progress',
        message: `An urgent clinical emergency is being attended to in ${queue.department.name}. Token ${item.entry.tokenNumber} revised estimated wait: ${item.revisedEstimate} mins. We appreciate your patience.`,
        type: 'EMERGENCY',
        metadata: {
          tokenNumber: item.entry.tokenNumber,
          department: queue.department.name,
          revisedEstimate: item.revisedEstimate,
        },
      });
    }
  }

  // 6. Record Audit Log
  await logAudit({
    userId: staffUserId,
    action: 'EMERGENCY_OVERRIDE_CONFIRMED',
    entityType: 'EmergencyQueueEvent',
    entityId: result.emergencyEvent.id,
    details: {
      queueId: queue.id,
      emergencyToken: generatedToken,
      reason,
      proposedDelayMins,
      affectedPatients: updatedEntries.length,
    },
  });

  // 7. Emit Live Socket Updates
  emitToDepartment(queue.departmentId, 'queue:emergency_inserted', {
    queueId: queue.id,
    emergencyToken: generatedToken,
    reason,
    timestamp: new Date(),
  });
  if (queue.doctorId) {
    emitToDoctor(queue.doctorId, 'queue:emergency_inserted', {
      emergencyToken: generatedToken,
      reason,
    });
  }
  emitToAll('queue:public_refresh', { departmentId: queue.departmentId });

  return result;
}

/**
 * Report Doctor Delay:
 * Updates doctor status, records DelayEvent, recalculates waiting times,
 * and notifies affected patients.
 */
export async function reportDoctorDelay(params: {
  doctorId: string;
  delayMinutes: number;
  reason: string;
  expectedReturnTime?: Date;
  reportedByUserId: string;
}) {
  const { doctorId, delayMinutes, reason, expectedReturnTime, reportedByUserId } = params;

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { department: true, user: true },
  });

  if (!doctor) {
    throw new Error('Doctor not found.');
  }

  // 1. Update doctor delay state
  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      currentDelayMins: delayMinutes,
      delayReason: reason,
      status: delayMinutes > 0 ? 'DELAYED' : 'AVAILABLE',
    },
  });

  // 2. Create DelayEvent record
  const delayEvent = await prisma.delayEvent.create({
    data: {
      doctorId,
      departmentId: doctor.departmentId,
      delayMinutes,
      reason,
      expectedReturnTime: expectedReturnTime || null,
      reportedByUserId,
    },
  });

  // 3. Find active queues for this doctor and recalculate
  const activeQueues = await prisma.queue.findMany({
    where: { doctorId, status: 'ACTIVE' },
  });

  for (const q of activeQueues) {
    const updated = await recalculateQueueEstimates(q.id, false);

    // Notify affected patients
    for (const item of updated) {
      await createNotification({
        userId: item.patientUser.id,
        title: `Doctor Delay Reported — ${doctor.user.fullName}`,
        message: `Dr. ${doctor.user.fullName} reported an operational delay of ~${delayMinutes} mins (${reason}). Your revised estimated wait is ${item.revisedEstimate} mins.`,
        type: 'DELAY',
        metadata: {
          doctorName: doctor.user.fullName,
          delayMinutes,
          tokenNumber: item.entry.tokenNumber,
        },
      });
    }
  }

  // 4. Audit Log
  await logAudit({
    userId: reportedByUserId,
    action: 'REPORT_DOCTOR_DELAY',
    entityType: 'Doctor',
    entityId: doctorId,
    details: { delayMinutes, reason, doctorName: doctor.user.fullName },
  });

  // 5. Broadcast updates
  emitToDepartment(doctor.departmentId, 'doctor:delay_updated', {
    doctorId,
    delayMinutes,
    reason,
  });
  emitToDoctor(doctorId, 'doctor:delay_updated', { delayMinutes, reason });
  emitToAll('queue:public_refresh', { departmentId: doctor.departmentId });

  return delayEvent;
}

/**
 * Doctor Reassignment Workflow:
 * Moves affected appointments and active queue entries from an unavailable doctor
 * to an eligible replacement doctor in the same department.
 */
export async function reassignDoctor(params: {
  currentDoctorId: string;
  replacementDoctorId: string;
  authorizedByUserId: string;
  reason: string;
}) {
  const { currentDoctorId, replacementDoctorId, authorizedByUserId, reason } = params;

  const currentDoc = await prisma.doctor.findUnique({
    where: { id: currentDoctorId },
    include: { department: true, user: true },
  });

  const replacementDoc = await prisma.doctor.findUnique({
    where: { id: replacementDoctorId },
    include: { department: true, user: true },
  });

  if (!currentDoc || !replacementDoc) {
    throw new Error('One or both doctors were not found.');
  }

  if (currentDoc.departmentId !== replacementDoc.departmentId) {
    throw new Error('Replacement doctor must belong to the same department.');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Execute reassignment transactionally
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update pending appointments
    const updatedAppts = await tx.appointment.updateMany({
      where: {
        doctorId: currentDoctorId,
        status: { in: ['BOOKED', 'CONFIRMED'] },
        appointmentDate: { gte: today },
      },
      data: {
        doctorId: replacementDoctorId,
        notes: `Reassigned from Dr. ${currentDoc.user.fullName}. Reason: ${reason}`,
      },
    });

    // 2. Update active queue entries
    const updatedEntries = await tx.queueEntry.updateMany({
      where: {
        doctorId: currentDoctorId,
        status: { in: ['WAITING', 'CALLED'] },
      },
      data: {
        doctorId: replacementDoctorId,
        notes: `Reassigned from Dr. ${currentDoc.user.fullName}. Reason: ${reason}`,
      },
    });

    // 3. Mark current doctor as OFF_DUTY or ON_BREAK
    await tx.doctor.update({
      where: { id: currentDoctorId },
      data: { status: 'OFF_DUTY', delayReason: reason },
    });

    return { updatedAppts, updatedEntries };
  });

  // 4. Recalculate estimates for replacement doctor's queues
  const replacementQueues = await prisma.queue.findMany({
    where: { doctorId: replacementDoctorId, status: 'ACTIVE' },
  });

  for (const q of replacementQueues) {
    await recalculateQueueEstimates(q.id, false);
  }

  // 5. Audit Log
  await logAudit({
    userId: authorizedByUserId,
    action: 'REASSIGN_DOCTOR',
    entityType: 'Doctor',
    entityId: currentDoctorId,
    details: {
      fromDoctor: currentDoc.user.fullName,
      toDoctor: replacementDoc.user.fullName,
      reason,
      appointmentsMoved: result.updatedAppts.count,
      queueEntriesMoved: result.updatedEntries.count,
    },
  });

  // 6. Broadcast updates
  emitToDepartment(currentDoc.departmentId, 'queue:reassigned', {
    fromDoctorId: currentDoctorId,
    toDoctorId: replacementDoctorId,
    timestamp: new Date(),
  });
  emitToAll('queue:public_refresh', { departmentId: currentDoc.departmentId });

  return result;
}

/**
 * Queue Call Next Patient:
 * Transitions currently CALLED entry to COMPLETED/NO_SHOW if requested,
 * sets the next WAITING entry to CALLED,
 * records timestamps, and broadcasts live.
 */
export async function callNextPatient(params: {
  queueId: string;
  doctorId: string;
  staffUserId: string;
}) {
  const { queueId, doctorId, staffUserId } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Find next waiting patient
    const nextEntry = await tx.queueEntry.findFirst({
      where: {
        queueId,
        status: 'WAITING',
      },
      include: {
        patient: { include: { user: true } },
        department: true,
      },
      orderBy: [
        { priority: 'desc' },
        { sequenceNumber: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    if (!nextEntry) {
      throw new Error('No waiting patients remaining in this queue.');
    }

    // 2. Update status to CALLED
    const calledEntry = await tx.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
        estimatedWaitMins: 0,
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        department: true,
      },
    });

    // 3. Record Audit
    await tx.auditLog.create({
      data: {
        userId: staffUserId,
        action: 'CALL_PATIENT',
        entityType: 'QueueEntry',
        entityId: calledEntry.id,
        details: JSON.stringify({
          tokenNumber: calledEntry.tokenNumber,
          roomNumber: calledEntry.doctor.roomNumber,
        }),
      },
    });

    // 4. Create Notification
    await tx.notification.create({
      data: {
        userId: calledEntry.patient.user.id,
        title: `Your Turn! Token ${calledEntry.tokenNumber}`,
        message: `Please proceed to ${calledEntry.doctor.roomNumber} for consultation with Dr. ${calledEntry.doctor.user.fullName}.`,
        type: 'TURN_APPROACHING',
        metadata: JSON.stringify({
          tokenNumber: calledEntry.tokenNumber,
          roomNumber: calledEntry.doctor.roomNumber,
        }),
      },
    });

    return calledEntry;
  });
}
