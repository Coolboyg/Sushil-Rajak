import { Server, Socket } from 'socket.io';
import { dispatchService } from '../services/dispatch.service.js';
import { ClientToServerEvents, ServerToClientEvents } from '../types/index.js';

export function setupSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
  dispatchService.setSocketServer(io);

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    // Join room for targeted alerts (e.g. "provider:prov_2", "customer:cust_1")
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    // 1. Customer initiates request
    socket.on('customer:service_request', (data) => {
      const created = dispatchService.createRequest(data);
      socket.emit('booking:status_update', {
        bookingId: created.id,
        status: 'SEARCHING',
      });
    });

    // 2. Provider accepts request
    socket.on('provider:accept_request', ({ requestId, providerId }) => {
      const result = dispatchService.acceptRequest(requestId, providerId);
      if (!result.success) {
        socket.emit('request:expired', {
          requestId,
          reason: result.error || 'Request already taken or expired.',
        });
      }
    });

    // 3. Provider rejects request
    socket.on('provider:reject_request', ({ requestId, providerId }) => {
      dispatchService.rejectRequest(requestId, providerId);
    });

    // 4. Provider location update for live GPS tracking
    socket.on('provider:update_location', ({ providerId, lat, lng }) => {
      dispatchService.updateProviderLocation(providerId, lat, lng);
    });

    // 5. Provider submits customer OTP
    socket.on('provider:verify_otp', ({ bookingId, otp }) => {
      const booking = dispatchService.getBookingById(bookingId);
      if (booking && booking.otp === otp.trim()) {
        dispatchService.updateBookingStatus(bookingId, 'SERVICE_STARTED');
        io.to(`customer:${booking.customerId}`).emit('booking:started', { bookingId });
      }
    });
  });
}
