const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const satelliteRoutes = require('./src/routes/satelliteRoutes');
const missionRoutes = require('./src/routes/missionRoutes');
const telemetryRoutes = require('./src/routes/telemetryRoutes');
const groundStationRoutes = require('./src/routes/groundStationRoutes');
const communicationRoutes = require('./src/routes/communicationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const alertRoutes = require('./src/routes/alertRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const { startSimulation } = require('./src/services/telemetrySimulator');
const errorHandler = require('./src/middleware/errorHandler');
const seedData = require('./src/utils/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(helmet());
app.use(morgan('dev'));

// Basic health route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OrbitalX Backend is running', timestamp: new Date() });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/satellites', satelliteRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/ground-stations', groundStationRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'API Route Not Found' });
});

// Global Error handler
app.use(errorHandler);

// Start server after DB is connected and seeded
async function startServer() {
  try {
    await connectDB();
    await seedData();
    
    if (process.env.NODE_ENV !== 'test') {
      startSimulation(10000);
    }

    const server = app.listen(PORT, () => {
      console.log(`[Server] OrbitalX backend started on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${PORT} is already in use. Please free up port ${PORT}.`);
      } else {
        console.error('[Server Error]', err);
      }
    });
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();

