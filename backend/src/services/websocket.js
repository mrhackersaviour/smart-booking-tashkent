const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const clients = new Map(); // userId -> Set of WebSocket connections

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let userId = null;

    // Handle authentication
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'auth') {
          // Verify JWT token
          const token = data.token;
          if (!token) {
            ws.send(JSON.stringify({ type: 'error', message: 'No token provided' }));
            return;
          }

          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            userId = decoded.id;

            // Add to clients map
            if (!clients.has(userId)) {
              clients.set(userId, new Set());
            }
            clients.get(userId).add(ws);

            ws.send(JSON.stringify({ type: 'auth_success', message: 'Connected' }));
            logger.info(`WebSocket: User ${userId} connected`);
          } catch (err) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
          }
        }

        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        logger.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (userId && clients.has(userId)) {
        clients.get(userId).delete(ws);
        if (clients.get(userId).size === 0) {
          clients.delete(userId);
        }
        logger.info(`WebSocket: User ${userId} disconnected`);
      }
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error:', err);
    });

    // Send initial connection message
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected. Please authenticate.' }));
  });

  logger.info('WebSocket server initialized');
  return wss;
}

// Send notification to specific user
function sendToUser(userId, notification) {
  if (clients.has(userId)) {
    const message = JSON.stringify({
      type: 'notification',
      data: notification,
    });

    clients.get(userId).forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    return true;
  }
  return false;
}

// Broadcast to all connected users
function broadcast(notification) {
  const message = JSON.stringify({
    type: 'broadcast',
    data: notification,
  });

  clients.forEach((userClients) => {
    userClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
}

// Get connected user count
function getConnectedCount() {
  return clients.size;
}

module.exports = {
  initWebSocket,
  sendToUser,
  broadcast,
  getConnectedCount,
};
