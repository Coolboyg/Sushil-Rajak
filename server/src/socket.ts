import http from 'http';
import { Server, Socket } from 'socket.io';
import { dispatchService } from './services/dispatch.service.js';
import { ClientToServerEvents, ServerToClientEvents } from './types/index.js';

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

/**
 * Initializes Socket.IO with the provided HTTP server and configures real-time
 * service dispatch events.
 */
export function initSocket(server: http.Server): Server<ClientToServerEvents, ServerToClientEvents> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance = io;
  dispatchService.setSocketServer(io);

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for targeted alerts (e.g., "customer:cust_1", "provider:prov_2", "admin:live")
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
    });

    // 1. Customer initiates real-time service request
    socket.on('customer:service_request', (data) => {
      console.log(`[Socket.IO] New service request from customer: ${data.customerName}`);
      const created = dispatchService.createRequest(data);
      socket.emit('booking:status_update', {
        bookingId: created.id,
        status: 'SEARCHING',
      });
    });

    // 2. Provider accepts dispatched request (with atomic concurrency lock)
    socket.on('provider:accept_request', ({ requestId, providerId }) => {
      console.log(`[Socket.IO] Provider ${providerId} accepting request ${requestId}`);
      const result = dispatchService.acceptRequest(requestId, providerId);
      if (!result.success) {
        socket.emit('request:expired', {
          requestId,
          reason: result.error || 'Request already assigned to another partner or expired.',
        });
      }
    });

    // 3. Provider rejects dispatched request
    socket.on('provider:reject_request', ({ requestId, providerId }) => {
      console.log(`[Socket.IO] Provider ${providerId} rejected request ${requestId}`);
      dispatchService.rejectRequest(requestId, providerId);
    });

    // 4. Provider streams live location for GPS tracking
    socket.on('provider:update_location', ({ providerId, lat, lng }) => {
      dispatchService.updateProviderLocation(providerId, lat, lng);
    });

    // 5. Provider enters customer 4-digit OTP upon arrival
    socket.on('provider:verify_otp', ({ bookingId, otp }) => {
      const booking = dispatchService.getBookingById(bookingId);
      if (booking && booking.otp === otp.trim()) {
        dispatchService.updateBookingStatus(bookingId, 'SERVICE_STARTED');
        io.to(`customer:${booking.customerId}`).emit('booking:started', { bookingId });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Returns the active Socket.IO server instance.
 */
export function getIO(): Server<ClientToServerEvents, ServerToClientEvents> {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized. Call initSocket(server) first.');
  }
  return ioInstance;
}
