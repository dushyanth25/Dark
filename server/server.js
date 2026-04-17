const app = require('./src/index');
const mongoose = require('mongoose');
const { startSimulation } = require('./services/simulationService');

// Wait for MongoDB to connect before starting the simulation
if (mongoose.connection.readyState === 1) {
  startSimulation();
} else {
  mongoose.connection.once('open', () => {
    startSimulation();
  });
}

// Establish MongoDB connection if not in test environment
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
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
