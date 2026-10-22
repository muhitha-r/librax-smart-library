const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Error: MONGODB_URI is not set in environment variables.');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');

    const adminEmail = 'admin@librax.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin user already exists: ${existingAdmin.email} (Role: ${existingAdmin.role})`);
    } else {
      const admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'AdminPassword123!',
        role: 'Admin',
      });
      console.log(`Created default Admin user: ${admin.email} (Role: ${admin.role})`);
    }

    // Also ensure a sample Librarian exists for testing
    const librarianEmail = 'librarian@librax.com';
    const existingLibrarian = await User.findOne({ email: librarianEmail });
    if (!existingLibrarian) {
      const librarian = await User.create({
        name: 'Head Librarian',
        email: librarianEmail,
        password: 'LibrarianPassword123!',
        role: 'Librarian',
      });
      console.log(`Created default Librarian user: ${librarian.email} (Role: ${librarian.role})`);
    } else {
      console.log(`Librarian user already exists: ${existingLibrarian.email}`);
    }

    await mongoose.disconnect();
    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
