const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Example time entries endpoint
app.get('/api/time-entries', (req, res) => {
  res.json({ message: 'Time entries endpoint' });
});

// Example stats endpoint
app.get('/api/time-entries/stats', (req, res) => {
  res.json({ message: 'Time entries stats endpoint' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export the Express API
module.exports = app; 