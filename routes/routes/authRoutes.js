const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const upload = require('../config/multerConfig');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

// ===================
// EMAIL TRANSPORTER (outside routes)
// ===================
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===================
// REGISTER (with Email Verification)
// ===================
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verifyUrl = `http://localhost:5000/api/auth/verify?token=${verificationToken}`;

    if (results.length > 0) {
      const existingUser = results[0];

      if (existingUser.is_verified) {
        return res.status(400).json({ message: 'User already exists' });
      }

      db.query(
        'UPDATE users SET verification_token = ? WHERE email = ?',
        [verificationToken, email],
        (updateErr) => {
          if (updateErr) return res.status(500).json({ error: updateErr.message });

          sendEmail(verifyUrl, email, res, 'Verification email resent.');
        }
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertSql = `
      INSERT INTO users (full_name, email, password_hash, verification_token, is_verified)
      VALUES (?, ?, ?, ?, 0)
    `;

    db.query(insertSql, [full_name, email, hashedPassword, verificationToken], (insertErr) => {
      if (insertErr) return res.status(500).json({ error: insertErr.message });

      sendEmail(verifyUrl, email, res, 'Registration successful. Please check your email to verify.');
    });
  });
});

function sendEmail(verifyUrl, email, res, successMessage) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email',
    html: `<p>Click the link to verify your email:</p><a href="${verifyUrl}">${verifyUrl}</a>`
  };

  transporter.sendMail(mailOptions, (mailErr) => {
    if (mailErr) {
      console.error('❌ Email Error:', mailErr.message);
      return res.status(500).json({ message: 'Failed to send verification email', error: mailErr.message });
    }

    return res.status(201).json({ message: successMessage });
  });
}


// ===================
// LOGIN (with Email Verification Check)
// ===================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    res.json({ message: 'Login successful', user: { id: user.id, full_name: user.full_name } });
  });
});

// ===================
// LOGOUT
// ===================
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// ===================
// GET PROFILE (Secure)
// ===================
router.get('/profile', requireAuth, (req, res) => {
  const userId = req.session.userId;

  db.query('SELECT id, full_name, email, profile_picture FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json({ user: results[0] });
  });
});


// ===================
// UPDATE PROFILE (Secure)
// ===================
router.put('/profile', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const { full_name, email, password } = req.body;

  if (!full_name || !email) {
    return res.status(400).json({ message: 'Full name and email are required' });
  }

  let updateQuery = 'UPDATE users SET full_name = ?, email = ?';
  let queryParams = [full_name, email];

  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = ?';
      queryParams.push(hashedPassword);
    } catch (err) {
      return res.status(500).json({ error: 'Password hashing failed' });
    }
  }

  updateQuery += ' WHERE id = ?';
  queryParams.push(userId);

  db.query(updateQuery, queryParams, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile updated successfully' });
  });
});


// ===================
// UPLOAD PROFILE PICTURE (Secure)
// ===================
router.post('/profile/upload', requireAuth, upload.single('profile_picture'), (req, res) => {
  const userId = req.session.userId;

  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  const imagePath = req.file.filename;

  const sql = `
    UPDATE users
    SET profile_picture = ?
    WHERE id = ?
  `;

  db.query(sql, [imagePath, userId], (err, result) => {
    if (err) {
      console.error('❌ Upload DB Error:', err);
      return res.status(500).json({ error: 'Failed to update profile picture' });
    }

    res.json({ message: '✅ Profile picture uploaded successfully', filename: imagePath });
  });
});


// ===================
// EMAIL VERIFICATION
// ===================
router.get('/verify', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('❌ Verification token is required.');
  }

  const sql = `
    UPDATE users
    SET is_verified = 1, verification_token = NULL
    WHERE verification_token = ?
  `;

  db.query(sql, [token], (err, result) => {
    if (err) {
      console.error('❌ Verification Error:', err);
      return res.status(500).send('Internal server error');
    }

    if (result.affectedRows === 0) {
      return res.status(400).send('❌ Invalid or expired verification token.');
    }

    res.send('✅ Email verified successfully! You can now log in.');
  });
});

module.exports = router;
