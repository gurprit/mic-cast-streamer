const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const sessions = new Map();

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.pathname.slice(1);

  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Set());
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    ws.sessionId = sessionId;
    sessions.get(sessionId).add(ws);
    ws.on("message", (msg) => {
      for (const client of sessions.get(sessionId)) {
        if (client !== ws && client.readyState === client.OPEN) {
          client.send(msg);
        }
      }
    });
    ws.on("close", () => {
      sessions.get(sessionId).delete(ws);
    });
  });
});

app.use("/sender", express.static(path.join(__dirname, "../sender")));
app.use("/receiver", express.static(path.join(__dirname, "../receiver")));

app.get("/", (req, res) => res.redirect("/receiver"));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
