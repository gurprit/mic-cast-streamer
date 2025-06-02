const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });
const sessions = {}; // { sessionId: Set of WebSocket clients }

wss.on('connection', (ws) => {
  let sessionId = null;

  ws.on('message', (message) => {
    if (typeof message === 'string') {
      // Expecting a JSON string with session info
      try {
        const data = JSON.parse(message);
        if (data.type === 'join' && data.sessionId) {
          sessionId = data.sessionId;
          if (!sessions[sessionId]) {
            sessions[sessionId] = new Set();
          }
          sessions[sessionId].add(ws);
          console.log(`Client joined session: ${sessionId}`);
        }
      } catch (e) {
        console.error('Invalid JSON:', e);
      }
    } else if (sessionId && sessions[sessionId]) {
      // Broadcast binary data to all clients in the same session
      sessions[sessionId].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });

  ws.on('close', () => {
    if (sessionId && sessions[sessionId]) {
      sessions[sessionId].delete(ws);
      if (sessions[sessionId].size === 0) {
        delete sessions[sessionId];
      }
    }
  });
});
