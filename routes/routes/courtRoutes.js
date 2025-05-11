const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');

// ===============================
// Multer Setup for Profile Picture
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.session.userId}${ext}`);
  }
});

const upload = multer({ storage });

// ===============================
// Middleware to Protect Routes
// ===============================
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// ===============================
// ✅ PUBLIC: GET Available Courts for Dropdowns
// ===============================
router.get('/', (req, res) => {
  const sql = `SELECT id, name, location FROM courts WHERE is_available = 1`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error loading courts:', err);
      return res.status(500).json({ message: 'Error loading courts' });
    }
    res.json({ courts: results });
  });
});


// ===============================
// GET /api/profile
// ===============================
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const sql = `
    SELECT id, full_name, email, location, birthdate, gender,
           phone_number, country_code, profile_picture,
           strength, wins, losses
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Error loading profile:', err);
      return res.status(500).json({ message: 'Server error loading profile' });
    }
    if (!results.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(results[0]);
  });
});

// ===============================
// GET /api/profile/stats
// ===============================
router.get('/stats', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const nameSql = `SELECT full_name FROM users WHERE id = ?`;

  db.query(nameSql, [userId], (err, result) => {
    if (err || result.length === 0) return res.status(500).json({ error: 'User not found' });

    const fullName = result[0].full_name;
    const statsSql = `
      SELECT 
        SUM(CASE WHEN winner = ? THEN 1 ELSE 0 END) AS wins,
        SUM(CASE WHEN (player1 = ? OR player2 = ?) AND winner != ? THEN 1 ELSE 0 END) AS losses
      FROM matches
    `;

    db.query(statsSql, [fullName, fullName, fullName, fullName], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const stats = results[0];
      res.json({
        wins: stats.wins || 0,
        losses: stats.losses || 0
      });
    });
  });
});

// ===============================
// PUT /api/profile
// ===============================
router.put('/', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const {
    full_name, email, location, birthdate, gender,
    phone_number, country_code, password
  } = req.body;

  const updateSql = `
    UPDATE users SET
      full_name = ?, email = ?, location = ?,
      birthdate = ?, gender = ?, phone_number = ?,
      country_code = ?${password ? ', password_hash = ?' : ''}
    WHERE id = ?
  `;

  const values = [
    full_name, email, location, birthdate, gender,
    phone_number, country_code
  ];

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    values.push(hashedPassword);
  }

  values.push(userId);

  db.query(updateSql, values, (err) => {
    if (err) {
      console.error('❌ Error updating profile:', err);
      return res.status(500).json({ message: 'Server error updating profile' });
    }
    res.json({ message: 'Profile updated successfully!' });
  });
});

// ===============================
// POST /api/profile/upload
// ===============================
router.post('/upload', requireAuth, upload.single('profile_picture'), (req, res) => {
  const userId = req.session.userId;
  const filename = req.file.filename;

  const sql = `UPDATE users SET profile_picture = ? WHERE id = ?`;
  db.query(sql, [filename, userId], (err) => {
    if (err) {
      console.error('❌ Error saving profile picture:', err);
      return res.status(500).json({ message: 'Error saving profile picture' });
    }
    res.json({ filename });
  });
});

module.exports = router;
