import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

// Enable Universal CORS
app.use(cors({
  origin: '*', // Allow all domains (Cloudflare, Localhost, etc.)
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Load data from disk
let stats = { userCount: 0, promptCount: 0, users: {} };
if (fs.existsSync(DATA_FILE)) {
  try {
    stats = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading data file", e);
  }
}

// Track endpoint
app.post('/api/track', (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    stats.promptCount++;
    
    // Count unique users
    if (!stats.users[userId]) {
      stats.users[userId] = true;
      stats.userCount++;
    }

    // Save to disk (Note: On Render Free tier, this is ephemeral and resets on deploy)
    fs.writeFileSync(DATA_FILE, JSON.stringify(stats));
    
    console.log(`[Analytics] Tracked User: ${userId} | Total Prompts: ${stats.promptCount}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Stats endpoint (Protected)
app.get('/api/stats', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer mini-admin-token') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json({ userCount: stats.userCount, promptCount: stats.promptCount });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'mini-admin') {
    res.json({ success: true, token: 'mini-admin-token' });
  } else {
    res.status(401).json({ success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
