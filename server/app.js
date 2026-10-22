const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const userRoutes = require('./routes/userRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const databaseStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

app.disable('x-powered-by');

// Dynamic CORS configuration allowing frontend origins with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check configured origins
      if (configuredOrigins.includes(origin) || configuredOrigins.includes('*')) {
        return callback(null, true);
      }

      // Allow any localhost / 127.0.0.1 port in development
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Root health & status endpoints
app.get('/', (_request, response) => {
  response.status(200).send('Librax API is running.');
});

app.get('/api/health', (_request, response) => {
  const databaseState = databaseStates[mongoose.connection.readyState] || 'unknown';

  response.status(200).json({
    status: 'ok',
    service: 'librax-api',
    database: databaseState,
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/borrow', borrowRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
