const express = require('express');
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// ============================
// GET match requests for logged-in user (as opponent)
// ============================
router.get('/', requireAuth, (req, res) => {
  const opponentId = req.session.userId;

  const sql = `
    SELECT mr.id, mr.requester_id, u.full_name AS requester_name,
           mr.proposed_date, mr.proposed_time, mr.status
    FROM match_requests mr
    JOIN users u ON mr.requester_id = u.id
    WHERE mr.opponent_id = ? AND (mr.status IS NULL OR mr.status = 'pending')
    ORDER BY mr.proposed_date DESC, mr.proposed_time DESC
  `;

  db.query(sql, [opponentId], (err, results) => {
    if (err) {
      console.error('❌ Failed to fetch match requests:', err);
      return res.status(500).json({ error: 'Failed to fetch match requests' });
    }
    res.json({ requests: results });
  });
});

// ============================
// Respond to a match request (accept or reject)
// ============================
router.put('/:id/respond', requireAuth, (req, res) => {
  const opponentId = req.session.userId;
  const requestId = req.params.id;
  const { response } = req.body;

  if (!['accepted', 'rejected'].includes(response)) {
    return res.status(400).json({ error: 'Invalid response value' });
  }

  // Step 1: Validate ownership
  const getSql = `SELECT * FROM match_requests WHERE id = ? AND opponent_id = ?`;
  db.query(getSql, [requestId, opponentId], (err, results) => {
    if (err) {
      console.error('❌ Error validating match request:', err);
      return res.status(500).json({ error: 'Database error during validation' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Match request not found or unauthorized' });
    }

    const request = results[0];

    // Step 2: Update the request status
    const updateSql = `UPDATE match_requests SET status = ? WHERE id = ?`;
    db.query(updateSql, [response, requestId], (err2) => {
      if (err2) {
        console.error('❌ Failed to update match request status:', err2);
        return res.status(500).json({ error: 'Failed to update request status' });
      }

      // Step 3: If accepted, update booking to store opponent_id
      if (response === 'accepted') {
        const bookingSql = `
          UPDATE bookings
          SET opponent_id = ?
          WHERE user_id = ? AND booking_date = ? AND booking_time = ?
        `;
        db.query(bookingSql, [opponentId, request.requester_id, request.proposed_date, request.proposed_time], (err3) => {
          if (err3) {
            console.error('❌ Failed to update booking with opponent:', err3);
            return res.status(500).json({ error: 'Booking update failed after accepting request' });
          }

          return res.json({ message: 'Request accepted and booking updated' });
        });
      } else {
        return res.json({ message: 'Request rejected successfully' });
      }
    });
  });
});

// ============================
// GET sent match requests (for requester to view their own requests)
// ============================
router.get('/sent', requireAuth, (req, res) => {
  const requesterId = req.session.userId;

  const sql = `
    SELECT mr.id, u.full_name AS opponent_name, mr.proposed_date, mr.proposed_time, mr.status
    FROM match_requests mr
    JOIN users u ON mr.opponent_id = u.id
    WHERE mr.requester_id = ?
    ORDER BY mr.proposed_date DESC, mr.proposed_time DESC
  `;

  db.query(sql, [requesterId], (err, results) => {
    if (err) {
      console.error('❌ Failed to fetch sent match requests:', err);
      return res.status(500).json({ error: 'Failed to fetch sent match requests' });
    }

    res.json({ sentRequests: results });
  });
});


module.exports = router;
