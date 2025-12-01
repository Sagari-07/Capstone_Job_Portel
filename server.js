// backend/server.js

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const { requireAuth, requireAdmin } = require('./middleware/auth');

/**
 * Quick start:
 * 1. npm install
 * 2. npm start
 */
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'capstone-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 4 // 4 hours
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);

const staticDir = path.join(__dirname);

app.get('/applied.html', requireAuth, (_req, res) => {
  res.sendFile(path.join(staticDir, 'applied.html'));
});

app.get('/admin.html', requireAdmin, (_req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

app.use(express.static(staticDir));

app.use((err, _req, res, _next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Resume must be 2 MB or smaller.' });
    }
    return res.status(400).json({ message: err.message || 'Request failed.' });
  }
  return res.status(500).json({ message: 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});