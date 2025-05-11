const express = require('express');
const router = express.Router();
const db = require('../config/db');

// =============================
// GET /api/matchmaking
// Supports filtering and pagination
// =============================
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 5;
  const offset = limit ? (page - 1) * limit : 0;

  const filters = [];
  const params = [];

  // Filters
  if (req.query.id) {
    filters.push('u.id = ?');
    params.push(req.query.id);
  }

  if (req.query.name) {
    filters.push('u.full_name LIKE ?');
    params.push(`%${req.query.name}%`);
  }

  if (req.query.gender) {
    filters.push('u.gender = ?');
    params.push(req.query.gender);
  }

  if (req.query.strength) {
    filters.push('u.strength = ?');
    params.push(req.query.strength);
  }

  const whereClause = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

  // Count total results
  const countSql = `SELECT COUNT(*) AS total FROM users u ${whereClause}`;

  // Fetch paginated results
  const dataSql = `
    SELECT u.id, u.full_name, u.strength, u.wins, u.losses, u.birthdate, u.gender
    FROM users u
    ${whereClause}
    ORDER BY u.id ASC
    ${limit ? 'LIMIT ? OFFSET ?' : ''}
  `;

  db.query(countSql, params, (err, countResult) => {
    if (err) {
      console.error('❌ Count error:', err);
      return res.status(500).json({ message: 'Count error' });
    }

    const total = countResult[0].total;
    const finalParams = limit ? [...params, limit, offset] : params;

    db.query(dataSql, finalParams, (err, results) => {
      if (err) {
        console.error('❌ Fetch error:', err);
        return res.status(500).json({ message: 'Fetch error' });
      }

      const players = results.map(player => {
        let age = "Unknown";
        if (player.birthdate) {
          const birth = new Date(player.birthdate);
          const today = new Date();
          age = today.getFullYear() - birth.getFullYear();
          if (
            today.getMonth() < birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
          ) {
            age--;
          }
        }

        return {
          id: player.id,
          full_name: player.full_name || "Unknown",
          strength: player.strength ?? "N/A",
          wins: player.wins ?? 0,
          losses: player.losses ?? 0,
          age,
          gender: player.gender || "Unknown",
          availability: "Available"
        };
      });

      res.status(200).json({
        players,
        pagination: {
          page,
          limit: limit || 'all',
          total,
          totalPages: limit ? Math.ceil(total / limit) : 1
        }
      });
    });
  });
});

module.exports = router;
