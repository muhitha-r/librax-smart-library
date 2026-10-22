require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/db');
const mongoose = require('mongoose');
const { startScheduler, stopScheduler } = require('./utils/scheduler');

const port = Number(process.env.PORT) || 5000;

async function startServer() {
  await connectDatabase();

  startScheduler();

  const server = app.listen(port, () => {
    console.info(`Librax API listening on port ${port}.`);
  });

  const shutdown = (signal) => {
    console.info(`${signal} received; shutting down gracefully.`);
    stopScheduler();
    server.close(async (error) => {
      if (error) {
        console.error('Failed to close the HTTP server cleanly.', error);
        process.exitCode = 1;
      }

      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error('Failed to disconnect from MongoDB cleanly.', disconnectError);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(async (error) => {
  const errorType = error && typeof error.name === 'string' ? error.name : 'UnknownError';
  const errorCode = error && typeof error.code === 'string' ? ` (${error.code})` : '';
  console.error(`Failed to start the Librax API because MongoDB could not be connected: ${errorType}${errorCode}.`);
  await mongoose.disconnect().catch((disconnectError) => {
    console.error('Failed to clean up the MongoDB connection.', disconnectError);
  });
  process.exitCode = 1;
});