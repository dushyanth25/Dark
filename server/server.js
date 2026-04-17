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
