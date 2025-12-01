const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Username/email and password are required' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ? LIMIT 1',
      [identifier, identifier]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return res.json({ user: req.session.user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Unable to log in right now' });
  }
});

router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(204).end();
  }

  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Failed to log out' });
    }
    res.clearCookie('sid');
    return res.status(200).json({ message: 'Logged out' });
  });
});

router.get('/me', (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  return res.json({ user: req.session.user });
});

module.exports = router;

