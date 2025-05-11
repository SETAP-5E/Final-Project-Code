const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const db = require('../config/db');

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit) || 5;
  const offset = limit ? (page - 1) * limit : 0;

  const filters = ['friends.user_id = ?'];
  const params = [userId];

  if (req.query.id) {
    filters.push('users.id = ?');
    params.push(req.query.id);
  }

  if (req.query.name) {
    filters.push('users.full_name LIKE ?');
    params.push(`%${req.query.name}%`);
  }

  if (req.query.location) {
    filters.push('users.location LIKE ?');
    params.push(`%${req.query.location}%`);
  }

  const whereClause = `WHERE ${filters.join(' AND ')}`;

  const countSql = `SELECT COUNT(*) AS total
    FROM users
    JOIN friends ON friends.friend_id = users.id
    ${whereClause}`;

  const dataSql = `
    SELECT users.id, users.full_name AS name, users.location
    FROM users
    JOIN friends ON friends.friend_id = users.id
    ${whereClause}
    ORDER BY users.id ASC
    ${limit ? 'LIMIT ? OFFSET ?' : ''}
  `;

  db.query(countSql, params, (err, countResult) => {
    if (err) {
      console.error('❌ Error counting friends:', err);
      return res.status(500).json({ message: 'Server error counting friends' });
    }

    const total = countResult[0].total;
    const dataParams = limit ? [...params, limit, offset] : params;

    db.query(dataSql, dataParams, (err, results) => {
      if (err) {
        console.error('❌ Error loading friends:', err);
        return res.status(500).json({ message: 'Server error loading friends' });
      }

      res.status(200).json({
        friends: results.map(friend => ({
          id: friend.id,
          name: friend.name,
          location: friend.location,
          status: 'Friend'
        })),
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
