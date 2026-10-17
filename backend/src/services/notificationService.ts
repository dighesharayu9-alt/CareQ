import prisma from '../prisma/client.js';
import { emitToUser } from './socketService.js';
import { NotificationType } from '../types/index.js';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: Record<string, any>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type || 'GENERAL',
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    });

    // Emit live to user
    emitToUser(params.userId, 'notification:received', notification);

    return notification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    return null;
  }
}
