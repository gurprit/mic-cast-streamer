const express = require('express');
const cors = require('cors'); // Import CORS middleware
const fs = require('fs'); // Keep fs for potential future use, though not directly for Blob storage

const app = express();
const PORT = process.env.PORT || 3000; // Changed default to 3000 as per original subtask suggestion

let audioBlob = null; // Variable to store the received audio Blob
let audioBuffer = null; // Variable to store the Buffer from the Blob for serving

app.use(cors()); // Enable CORS for all routes and origins

// Middleware to parse raw body for POST requests to /stream
app.use('/stream', express.raw({ type: 'audio/webm', limit: '50mb' })); // Adjust limit as needed

app.post('/stream', (req, res) => {
  if (req.body && req.body.length > 0) {
    // The body is a Buffer here due to express.raw()
    audioBuffer = req.body;
    audioBlob = new Blob([req.body], { type: 'audio/webm' }); // Store Blob info for potential metadata use
    console.log(`Received audio data, size: ${audioBuffer.length} bytes`);
    res.status(200).send('Audio received successfully.');
  } else {
    console.log('No audio data received in POST request.');
    res.status(400).send('No audio data received.');
  }
});

app.get('/stream', (req, res) => {
  if (audioBuffer) {
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Length', audioBuffer.length);
    res.status(200).send(audioBuffer);
    console.log(`Serving audio data, size: ${audioBuffer.length} bytes`);
  } else {
    console.log('No audio data available for GET request.');
    res.status(404).send('No audio data available.');
  }
});

// Optional: A simple root path response
app.get('/', (req, res) => {
  res.send('Audio streaming server is running. POST to /stream to upload, GET /stream to listen.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`CORS enabled for all origins.`);
  console.log(`Endpoints:`);
  console.log(`  POST /stream - Expects 'audio/webm' body`);
  console.log(`  GET /stream  - Serves 'audio/webm' if available`);
});
