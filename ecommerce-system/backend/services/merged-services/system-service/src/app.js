const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Client } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Route imports
const systemRoutes = require('./routes/system');
const logRoutes = require('./routes/log');
const notificationRoutes = require('./routes/notification');
const utilityRoutes = require('./routes/utility');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/logs', logRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/utility', utilityRoutes);

// Health Check
app.get('/health', async (req, res) => {
  // Simplified health check for now
  res.json({
    success: true,
    service: 'System Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API Health Check (for Docker health check)
app.get('/api/v1/health', async (req, res) => {
  res.json({
    success: true,
    service: 'System Service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'System Service - 系統管理服務',
    version: '1.0.0'
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API Endpoint not found',
    path: req.originalUrl
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('System Service Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 System Service started successfully on port ${PORT}`);
});

module.exports = app;
