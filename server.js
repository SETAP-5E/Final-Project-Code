// =============================
// Book a Court - Backend Server
// =============================

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./config/db'); // MySQL connection setup
require('dotenv').config(); // Load environment variables

console.log("EMAIL_HOST from server.js:", process.env.EMAIL_HOST);

const app = express();

// =======================
// Middleware Configuration
// =======================

app.use(helmet());

// ✅ Serve frontend static files FIRST
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// ✅ CORS Setup
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000'],
  credentials: true
}));

app.use(express.json());

// ✅ Session Configuration
if (!process.env.SESSION_SECRET) {
  console.error("❗ SESSION_SECRET is not defined in .env file.");
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // HTTPS only in production
    sameSite: 'lax'
  }
}));

// ✅ Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =======================
// Route Registration
// =======================
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const historyRoutes = require('./routes/historyRoutes');
const courtRoutes = require('./routes/courtRoutes');
const matchmakingRoutes = require('./routes/matchmakingRoutes');
const profileRoutes = require('./routes/profileRoutes'); // ✅ NEW profileRoutes

app.use('/api/auth', authRoutes);
app.use('/api/book', bookingRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/profile', profileRoutes); // ✅ REGISTER profile route

// =======================
// Serve frontend index.html
// =======================
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ✅ Fallback for unknown routes
app.get('*', (req, res) => {
  res.status(404).send('❌ Page not found.');
});

// =======================
// Server Start
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
