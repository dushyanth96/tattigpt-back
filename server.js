const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;   // FIXED 🔥
const DB_FILE = path.join(__dirname, 'stats.json');

app.use(cors());
app.use(express.json());

// Initialize stats file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], prompts: 0 }));
}

// Helper to read/write stats
const getStats = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const saveStats = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Track user activity
app.post('/api/track', (req, res) => {
  try {
    const { userId } = req.body;
    const data = getStats();

    if (userId && !data.users.includes(userId)) {
      data.users.push(userId);
    }

    data.prompts = (data.prompts || 0) + 1;

    saveStats(data);
    res.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'mini-admin') {
    res.json({ success: true, token: 'admin-secret-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get Analytics (Protected)
app.get('/api/stats', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== 'Bearer admin-secret-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const data = getStats();
    res.json({
      userCount: data.users.length,
      promptCount: data.prompts
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
