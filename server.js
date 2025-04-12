const express = require('express');
const cors = require('cors');

const app = express();
const port = 5000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Example routes
app.get('/api/time-entries', (req, res) => {
  res.json({ message: 'Time entries endpoint' });
});

app.get('/api/time-entries/stats', (req, res) => {
  res.json({ message: 'Time entries stats endpoint' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 