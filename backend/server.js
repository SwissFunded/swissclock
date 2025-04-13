const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to SwissClock API',
    version: '1.0.0',
    documentation: '/api',
    status: 'running'
  });
});

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

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'SwissClock API',
    endpoints: [
      '/api/health',
      '/api/time-entries',
      '/api/time-entries/stats'
    ]
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

// Start server if running locally
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the Express API
module.exports = app; 