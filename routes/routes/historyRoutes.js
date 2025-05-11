const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const db = require('../config/db');

// =========================
// GET /api/history with pagination & filters
// =========================
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 5;
  const offset = limit ? (page - 1) * limit : 0;

  const filters = [];
  const filterParams = [];

  // Always filter for the current user's matches
  filters.push("(m.player1_id = ? OR m.player2_id = ?)");
  filterParams.push(userId, userId);

  // Optional filters
  if (req.query.date) {
    filters.push("m.match_date = ?");
    filterParams.push(req.query.date);
  }
  if (req.query.player) {
    filters.push("(u1.full_name LIKE ? OR u2.full_name LIKE ?)");
    filterParams.push(`%${req.query.player}%`, `%${req.query.player}%`);
  }
  if (req.query.winner) {
    filters.push("u3.full_name LIKE ?");
    filterParams.push(`%${req.query.winner}%`);
  }
  if (req.query.court) {
    filters.push("c.name LIKE ?");
    filterParams.push(`%${req.query.court}%`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  // Count query
  const countSql = `
    SELECT COUNT(*) AS total
    FROM matches m
    JOIN users u1 ON m.player1_id = u1.id
    JOIN users u2 ON m.player2_id = u2.id
    LEFT JOIN users u3 ON m.winner_id = u3.id
    LEFT JOIN courts c ON m.court_id = c.id
    ${whereClause}
  `;

  // Data query with optional limit & offset
  const dataSql = `
    SELECT 
      m.id,
      m.match_date AS date,
      m.match_time AS time,
      m.score,
      u1.full_name AS player1,
      u2.full_name AS player2,
      u3.full_name AS winner,
      c.name AS court_name,
      m.location
    FROM matches m
    JOIN users u1 ON m.player1_id = u1.id
    JOIN users u2 ON m.player2_id = u2.id
    LEFT JOIN users u3 ON m.winner_id = u3.id
    LEFT JOIN courts c ON m.court_id = c.id
    ${whereClause}
    ORDER BY m.match_date DESC, m.match_time DESC
    ${limit ? 'LIMIT ? OFFSET ?' : ''}
  `;

  // First count results
  db.query(countSql, filterParams, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Error counting matches", error: err.message });

    const total = countResult[0].total;
    const dataParams = limit ? [...filterParams, limit, offset] : filterParams;

    db.query(dataSql, dataParams, (err, matchResults) => {
      if (err) return res.status(500).json({ message: "Error loading matches", error: err.message });

      return res.status(200).json({
        matches: matchResults,
        pagination: {
          page,
          limit: limit || "all",
          total,
          totalPages: limit ? Math.ceil(total / limit) : 1
        }
      });
    });
  });
});

module.exports = router;
