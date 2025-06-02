// server.js
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

// Map of sessionId -> Set of WebSocket clients
const sessions = new Map();

server.on('upgrade', (request, socket, head) => {
  const parsedUrl = url.parse(request.url, true);
  const sessionId = parsedUrl.pathname.split('/')[2]; // e.g. /ws/abc123

  if (!sessionId) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    ws.sessionId = sessionId;
    ws.userName = parsedUrl.query.name || 'Anonymous';

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, new Set());
    }
    sessions.get(sessionId).add(ws);

    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  console.log(`Client connected to session ${ws.sessionId} as ${ws.userName}`);

  ws.on('message', (data) => {
    const sessionClients = sessions.get(ws.sessionId);
    if (!sessionClients) return;

    for (const client of sessionClients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Send the name and audio chunk together as a single object
        const payload = {
          name: ws.userName,
          audio: data.toString('base64')
        };
        client.send(JSON.stringify(payload));
      }
    }
  });

  ws.on('close', () => {
    const sessionClients = sessions.get(ws.sessionId);
    if (sessionClients) {
      sessionClients.delete(ws);
      if (sessionClients.size === 0) {
        sessions.delete(ws.sessionId);
      }
    }
  });
});

app.get('/', (req, res) => {
  res.send('WebSocket Session Server Running');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
