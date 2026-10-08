import http from 'http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { config } from './config/index.js';
import { setupSocketHandlers } from './socket/socket.handler.js';
import { ClientToServerEvents, ServerToClientEvents } from './types/index.js';

const server = http.createServer(app);

// Setup Socket.IO Server
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setupSocketHandlers(io);

server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  GHARSAATHI Backend Server Running on Port ${config.port}`);
  console.log(`  Tagline: ${config.brandTagline}`);
  console.log(`  Support Hotline: ${config.businessSupportPhone}`);
  console.log(`  WebSocket / Socket.IO Initialized for Real-Time Dispatch`);
  console.log(`=======================================================`);
});
