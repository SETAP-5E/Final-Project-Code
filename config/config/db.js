// =============================
// MySQL Database Connection (Fixed - No Promise)
// =============================

const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'book_a_court_db',
  multipleStatements: true // ✅ optional for multiple SQL if you ever need
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1); // ✅ Safer: stop the app if connection fails
  }
  console.log('✅ Connected to MySQL Database');
});

module.exports = db;
