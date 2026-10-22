const mongoose = require('mongoose');

async function connectDB() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is required to connect to MongoDB.');
  }

  if (!MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must use the MongoDB Atlas mongodb+srv scheme.');
  }

  await mongoose.connect(MONGODB_URI);
  console.info('Connected to MongoDB Atlas.');
}

module.exports = connectDB;
