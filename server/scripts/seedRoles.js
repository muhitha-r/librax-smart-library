const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const defaultUsers = [
  {
    name: 'System Admin',
    email: 'admin@librax.com',
    password: 'AdminPassword123!',
    role: 'Admin',
  },
  {
    name: 'Head Librarian',
    email: 'librarian@librax.com',
    password: 'LibrarianPassword123!',
    role: 'Librarian',
  },
  {
    name: 'Prof. David Clark',
    email: 'staff@librax.com',
    password: 'StaffPassword123!',
    role: 'Staff',
  },
  {
    name: 'Alex Johnson',
    email: 'student@librax.com',
    password: 'StudentPassword123!',
    role: 'Student',
  },
];

async function seedRoles() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Error: MONGODB_URI is not set in environment variables.');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');

    for (const u of defaultUsers) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        if (existing.role !== u.role) {
          existing.role = u.role;
          await existing.save();
          console.log(`Updated role for ${u.email} -> ${u.role}`);
        } else {
          console.log(`User ${u.email} already exists with role ${existing.role}`);
        }
      } else {
        const created = await User.create(u);
        console.log(`Created default user: ${created.email} (Role: ${created.role})`);
      }
    }

    await mongoose.disconnect();
    console.log('Roles seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed roles:', error);
    process.exit(1);
  }
}

seedRoles();

