import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';

let ioInstance: SocketIOServer | null = null;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://parkit-kappa.vercel.app',
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(...process.env.CLIENT_URL.split(',').map(s => s.trim()));
}

export const initSocket = (server: http.Server): SocketIOServer => {
  ioInstance = new SocketIOServer(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join a parking lot room to listen for slot updates
    socket.on('joinLot', (lotId: string | number) => {
      const roomName = `lot_${lotId}`;
      socket.join(roomName);
      console.log(`Client ${socket.id} joined room ${roomName}`);
    });

    socket.on('leaveLot', (lotId: string | number) => {
      const roomName = `lot_${lotId}`;
      socket.leave(roomName);
      console.log(`Client ${socket.id} left room ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized!');
  }
  return ioInstance;
};

export const broadcastSlotUpdate = (lotId: number, slotId: number, isAvailable: boolean) => {
  if (ioInstance) {
    const roomName = `lot_${lotId}`;
    ioInstance.to(roomName).emit('slotUpdate', { slotId, isAvailable });
    console.log(`📢 Broadcasted slotUpdate to ${roomName}: slotId ${slotId} -> ${isAvailable ? 'available' : 'occupied'}`);
  }
};
