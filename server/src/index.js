require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const marketRoutes = require('../routes/marketRoutes');
const tradeRoutes = require('../routes/tradeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1️⃣ API Routes (must come FIRST)
app.use('/api/auth', authRoutes);
app.use('/api', marketRoutes);
app.use('/api', tradeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Gotham server is online', timestamp: new Date().toISOString() });
});

// 2️⃣ API 404 handler for unknown /api/* routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 3️⃣ Serve static files from public folder (frontend build)
app.use(express.static(path.join(__dirname, '../public')));

// 4️⃣ SPA catch-all with file existence check (BEFORE global error handler)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // If index.html doesn't exist (e.g., tests without build), return 404
    res.status(404).json({ message: 'Route not found' });
  }
});

// 5️⃣ Global error handler (must be LAST)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to MongoDB and start server only if this file is run directly
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`🦇 Batman server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;
