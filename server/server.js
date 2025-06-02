const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

const sessions = {};

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const sessionId = url.pathname.split('/')[1];

  if (!sessionId) {
    socket.destroy();
    return;
  }

  if (!sessions[sessionId]) {
    sessions[sessionId] = new Set();
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    ws.sessionId = sessionId;
    sessions[sessionId].add(ws);

    ws.on('message', (data) => {
      sessions[sessionId].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });

    ws.on('close', () => {
      sessions[sessionId].delete(ws);
      if (sessions[sessionId].size === 0) {
        delete sessions[sessionId];
      }
    });
  });
});

app.get('/', (req, res) => {
  res.send('Mic-Cast WebSocket Server Running');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
