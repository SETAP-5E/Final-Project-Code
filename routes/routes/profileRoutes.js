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


// GET /api/profile/stats/update (based on IDs, not names)
// ===============================
router.get('/stats/update', requireAuth, (req, res) => {
  const userId = req.session.userId;

  const winsSql = `
    SELECT COUNT(*) AS wins FROM matches
    WHERE winner_id = ?
  `;
  const lossesSql = `
    SELECT COUNT(*) AS losses FROM matches
    WHERE (player1_id = ? OR player2_id = ?)
    AND winner_id IS NOT NULL AND winner_id != ?
  `;

  db.query(winsSql, [userId], (err, winResults) => {
    if (err) {
      console.error('❌ Error calculating wins:', err);
      return res.status(500).json({ error: 'Error calculating wins' });
    }

    const wins = winResults[0].wins || 0;

    db.query(lossesSql, [userId, userId, userId], (err, lossResults) => {
      if (err) {
        console.error('❌ Error calculating losses:', err);
        return res.status(500).json({ error: 'Error calculating losses' });
      }

      const losses = lossResults[0].losses || 0;
      const total = wins + losses;
      const strength = total > 0 ? Math.min(10, Math.round((wins / total) * 10)) : 0;

      const updateSql = `UPDATE users SET wins = ?, losses = ?, strength = ? WHERE id = ?`;
      db.query(updateSql, [wins, losses, strength, userId], (updateErr) => {
        if (updateErr) {
          console.error('❌ Failed to update stats:', updateErr);
          return res.status(500).json({ error: 'Failed to update stats' });
        }

        res.json({ wins, losses, total, strength });
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
