import http from 'http';
import { app } from './app.js';
import { config } from './config/index.js';
import { initSocket } from './socket.js';

// Create HTTP server from Express application
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server to enable real-time dispatch events
const io = initSocket(server);

// Start listening on configured port
server.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`  GHARSAATHI Backend Server Running on Port ${config.port}`);
  console.log(`  Tagline: ${config.brandTagline}`);
  console.log(`  Support Hotline: ${config.businessSupportPhone}`);
  console.log(`  WebSocket / Socket.IO Initialized for Real-Time Dispatch`);
  console.log(`=======================================================`);
});

export { app, server, io };
