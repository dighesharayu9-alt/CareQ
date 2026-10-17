import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HttpServer, frontendUrl: string): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room handlers
    socket.on('join:department', (departmentId: string) => {
      socket.join(`department:${departmentId}`);
    });

    socket.on('leave:department', (departmentId: string) => {
      socket.leave(`department:${departmentId}`);
    });

    socket.on('join:doctor', (doctorId: string) => {
      socket.join(`doctor:${doctorId}`);
    });

    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
    });

    socket.on('join:patient', (patientId: string) => {
      socket.join(`patient:${patientId}`);
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToDepartment(departmentId: string, event: string, data: any) {
  if (io) {
    io.to(`department:${departmentId}`).emit(event, data);
    io.emit('queue:global_change', { departmentId, event, data });
  }
}

export function emitToDoctor(doctorId: string, event: string, data: any) {
  if (io) {
    io.to(`doctor:${doctorId}`).emit(event, data);
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
