const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const url = require('url');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const sessions = {}; // sessionId => Set of clients

server.on('upgrade', (request, socket, head) => {
  const { query } = url.parse(request.url, true);
  const sessionId = query.session;

  if (!sessionId) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    ws.sessionId = sessionId;
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
  const sessionId = ws.sessionId;

  if (!sessions[sessionId]) {
    sessions[sessionId] = new Set();
  }

  sessions[sessionId].add(ws);
  console.log(`Client connected to session: ${sessionId}`);

  ws.on('message', (data) => {
    for (const client of sessions[sessionId]) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  });

  ws.on('close', () => {
    sessions[sessionId].delete(ws);
    if (sessions[sessionId].size === 0) {
      delete sessions[sessionId];
    }
    console.log(`Client disconnected from session: ${sessionId}`);
  });
});

app.get('/', (req, res) => res.send('Mic Cast WebSocket Server Running'));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
