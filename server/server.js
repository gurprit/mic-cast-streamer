const express = require('express');
const fs = require('fs');
const { PassThrough } = require('stream');

const app = express();
const PORT = process.env.PORT || 8080;

const audioStream = new PassThrough();

app.use(express.static(__dirname));

app.post('/upload', (req, res) => {
  req.pipe(audioStream, { end: false });
  res.status(200).end();
});

app.get('/live-audio.webm', (req, res) => {
  res.setHeader('Content-Type', 'audio/webm');
  audioStream.pipe(res);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
