const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `resume-${timestamp}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
    return cb(null, true);
  }
});

router.post('/', upload.single('resume'), async (req, res) => {
  const { name, email, jobId, jobTitle } = req.body;

  if (!name || name.length < 2 || name.length > 120) {
    return res.status(400).json({ message: 'Name is required (2-120 characters).' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }
  if (!jobId || !jobTitle) {
    return res.status(400).json({ message: 'Job details are missing.' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'Resume upload is required.' });
  }

  const resumePath = `/uploads/${req.file.filename}`;
  const userId = req.session?.user?.id || null;

  try {
    await pool.execute(
      `INSERT INTO job_applications
        (job_id, job_title, applicant_name, applicant_email, resume_file_path, user_id)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [jobId, jobTitle, name.trim(), email.trim(), resumePath, userId]
    );

    return res.status(201).json({ message: 'Application saved successfully.' });
  } catch (err) {
    console.error('Application save error:', err);
    return res.status(500).json({ message: 'Unable to save application right now.' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const { user } = req.session;
  const isAdmin = user.role === 'admin';

  try {
    let query;
    let params;
    if (isAdmin) {
      query = `SELECT id, job_id, job_title, applicant_name, applicant_email, resume_file_path, applied_at
               FROM job_applications
               ORDER BY applied_at DESC`;
      params = [];
    } else {
      query = `SELECT id, job_id, job_title, applicant_name, applicant_email, resume_file_path, applied_at
               FROM job_applications
               WHERE user_id = ? OR applicant_email = ?
               ORDER BY applied_at DESC`;
      params = [user.id, user.email];
    }

    const [rows] = await pool.execute(query, params);
    return res.json({ applications: rows });
  } catch (err) {
    console.error('Fetch applications error:', err);
    return res.status(500).json({ message: 'Unable to fetch applications.' });
  }
});

module.exports = router;

