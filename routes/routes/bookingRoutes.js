// ============================
// bookingRoutes.js (Final - Safely Updated with Match Request Logic)
// ============================

const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// ============================
// CREATE BOOKING
// ============================
router.post('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { court_id, court_name, location, booking_date, booking_time, opponent_id } = req.body;

  if (!court_id || !court_name || !location || !booking_date || !booking_time) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const bookingDateTime = new Date(`${booking_date}T${booking_time}`);
  const now = new Date();
  if (bookingDateTime < now) {
    return res.status(400).json({ message: 'Booking time cannot be in the past' });
  }

  const hour = parseInt(booking_time.split(':')[0]);
  const nextHour = (hour + 1) % 24;
  const time1 = `${String(hour).padStart(2, '0')}:00`;
  const time2 = `${String(nextHour).padStart(2, '0')}:00`;

  const checkSql = `
    SELECT COUNT(*) AS count FROM bookings
    WHERE court_id = ? AND booking_date = ? AND booking_time IN (?, ?)
    AND (status IS NULL OR status != 'canceled')
  `;

  db.query(checkSql, [court_id, booking_date, time1, time2], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results[0].count > 0) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    if (opponent_id) {
      insertBookingAndRequest(opponent_id, false);
    } else {
      const findOpponentSql = `SELECT id FROM users WHERE id != ? ORDER BY RAND() LIMIT 1`;
      db.query(findOpponentSql, [userId], (opErr, opResult) => {
        if (opErr || opResult.length === 0) {
          return res.status(500).json({ message: 'No opponent found for matchmaking' });
        }
        const randomOpponentId = opResult[0].id;
        insertBookingAndRequest(randomOpponentId, true);
      });
    }

    function insertBookingAndRequest(opponentId, isRandom) {
      const insertSql = `
        INSERT INTO bookings (user_id, court_id, court_name, location, booking_date, booking_time, opponent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(insertSql, [userId, parseInt(court_id), court_name.trim(), location.trim(), booking_date, booking_time, opponentId], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const insertRequestSql = `
          INSERT INTO match_requests (requester_id, opponent_id, proposed_date, proposed_time)
          VALUES (?, ?, ?, ?)
        `;
        db.query(insertRequestSql, [userId, opponentId, booking_date, booking_time], (err2) => {
          if (err2) console.error('❌ Match request insert error:', err2);
        });

        const msg = isRandom
          ? 'Booking created and opponent assigned randomly'
          : 'Booking created successfully';
        res.status(201).json({ message: msg });
      });
    }
  });
});




// ============================
// CANCEL BOOKING
// ============================
router.put('/:id/cancel', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const bookingId = req.params.id;

  const sql = `UPDATE bookings SET status = 'canceled' WHERE id = ? AND user_id = ?`;

  db.query(sql, [bookingId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    res.json({ message: 'Booking canceled successfully' });
  });
});

// ============================
// EDIT BOOKING (with conflict check)
// ============================
router.put('/:id', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const bookingId = req.params.id;
  const { court_id, court_name, location, booking_date, booking_time } = req.body;

  if (!court_id || !court_name || !location || !booking_date || !booking_time) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const bookingDateTime = new Date(`${booking_date}T${booking_time}`);
  const now = new Date();
  if (bookingDateTime < now) {
    return res.status(400).json({ message: 'Booking time cannot be in the past' });
  }

  const hour = parseInt(booking_time.split(':')[0]);
  const nextHour = (hour + 1) % 24;
  const time1 = `${String(hour).padStart(2, '0')}:00`;
  const time2 = `${String(nextHour).padStart(2, '0')}:00`;

  const checkSql = `
    SELECT COUNT(*) AS count FROM bookings
    WHERE court_id = ? AND booking_date = ? AND booking_time IN (?, ?)
    AND id != ? AND (status IS NULL OR status != 'canceled')
  `;

  db.query(checkSql, [court_id, booking_date, time1, time2, bookingId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results[0].count > 0) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const updateSql = `
      UPDATE bookings
      SET court_id = ?, court_name = ?, location = ?, booking_date = ?, booking_time = ?
      WHERE id = ? AND user_id = ? AND (status IS NULL OR status != 'canceled')
    `;

    db.query(updateSql, [court_id, court_name.trim(), location.trim(), booking_date, booking_time, bookingId, userId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Booking not found or already canceled' });
      }
      res.json({ message: 'Booking updated successfully' });
    });
  });
});

// ============================
// DELETE BOOKING
// ============================
router.delete('/:id', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const bookingId = req.params.id;
  const sql = `DELETE FROM bookings WHERE id = ? AND user_id = ?`;

  db.query(sql, [bookingId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    res.json({ message: 'Booking deleted successfully' });
  });
});

// ============================
// GET BOOKING BY ID
// ============================
router.get('/:id', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const bookingId = req.params.id;

  const sql = `
    SELECT id, court_id, court_name, location, booking_date, booking_time
    FROM bookings
    WHERE id = ? AND user_id = ? AND (status IS NULL OR status != 'canceled')
  `;

  db.query(sql, [bookingId, userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ message: 'Booking not found or unauthorized' });
    }
    res.json({ booking: results[0] });
  });
});

// ============================
// GET BOOKINGS + FILTER + PAGINATION
// ============================
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { court_name, location, from_date, to_date, page = 1, rows = 5 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(rows);
  const limit = parseInt(rows);

  let baseSql = `
    FROM bookings b
    LEFT JOIN users u ON b.opponent_id = u.id
    WHERE b.user_id = ? AND (b.status IS NULL OR b.status != 'canceled')
  `;
  const params = [userId];

  if (court_name) {
    baseSql += ' AND b.court_name LIKE ?';
    params.push(`%${court_name.trim()}%`);
  }
  if (location) {
    baseSql += ' AND b.location LIKE ?';
    params.push(`%${location.trim()}%`);
  }
  if (from_date) {
    baseSql += ' AND b.booking_date >= ?';
    params.push(from_date);
  }
  if (to_date) {
    baseSql += ' AND b.booking_date <= ?';
    params.push(to_date);
  }

  const countSql = `SELECT COUNT(*) AS total ${baseSql}`;
  const dataSql = `
    SELECT b.id, b.court_id, b.court_name, b.location,
           b.booking_date, b.booking_time, b.opponent_id,
           u.full_name AS opponent_name
    ${baseSql}
    ORDER BY b.booking_date DESC, b.booking_time DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalCount = countResult[0].total;

    db.query(dataSql, [...params, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ bookings: results, totalCount });
    });
  });
});



// ============================
// GET COURTS (for dropdowns)
// ============================
router.get('/courts', (req, res) => {
  const sql = `SELECT id, name, location FROM courts WHERE is_available = 1`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ courts: results });
  });
});

// ============================
// GET BLOCKED TIME SLOTS
// ============================
router.get('/blocked', requireAuth, (req, res) => {
  const { court_id, booking_date } = req.query;

  if (!court_id || !booking_date) {
    return res.status(400).json({ message: 'court_id and booking_date are required' });
  }

  const sql = `
    SELECT booking_time FROM bookings
    WHERE court_id = ? AND booking_date = ? AND (status IS NULL OR status != 'canceled')
  `;

  db.query(sql, [court_id, booking_date], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const blockedTimes = new Set();
    results.forEach(row => {
      const [h, m] = row.booking_time.split(':').map(Number);
      blockedTimes.add(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      blockedTimes.add(`${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    });

    res.json({ blocked: Array.from(blockedTimes) });
  });
});

module.exports = router;
