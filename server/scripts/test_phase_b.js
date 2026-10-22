const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Book = require('../models/Book');
const Wishlist = require('../models/Wishlist');
const { generateToken } = require('../utils/jwt');

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- TESTING PHASE B: STUDENT WISHLIST ---');

  // Find a student and a staff/admin user
  const student = await User.findOne({ role: 'Student' });
  const staff = await User.findOne({ role: { $in: ['Staff', 'Admin'] } });

  if (!student || !staff) {
    throw new Error('Required student and staff/admin users not found in database');
  }

  // Create a test book
  const testBook = await Book.create({
    title: 'Wishlist Test Book ' + Date.now(),
    ISBN: 'WISH-' + Date.now(),
    author: 'Ada Lovelace',
    category: 'Computer Science',
    totalCopies: 3,
    availableCopies: 3,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c',
  });
  console.log('Created test book:', testBook.title);

  const studentToken = generateToken(student);
  const staffToken = generateToken(staff);
  const BASE_URL = 'http://localhost:5000';

  // 1. RBAC Test: Staff/Admin attempts to access wishlist endpoints (should be rejected with 403)
  console.log('1. Testing RBAC: Non-student roles rejected with 403...');
  const staffAddRes = await fetch(`${BASE_URL}/api/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + staffToken },
    body: JSON.stringify({ bookId: testBook._id.toString() }),
  });
  console.log('   Staff POST /api/wishlist status:', staffAddRes.status);
  if (staffAddRes.status !== 403) throw new Error('Non-student POST should return 403');

  const staffGetRes = await fetch(`${BASE_URL}/api/wishlist`, {
    headers: { Authorization: 'Bearer ' + staffToken },
  });
  console.log('   Staff GET /api/wishlist status:', staffGetRes.status);
  if (staffGetRes.status !== 403) throw new Error('Non-student GET should return 403');

  const staffDelRes = await fetch(`${BASE_URL}/api/wishlist/${testBook._id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + staffToken },
  });
  console.log('   Staff DELETE /api/wishlist/:id status:', staffDelRes.status);
  if (staffDelRes.status !== 403) throw new Error('Non-student DELETE should return 403');

  // 2. Student adds test book to wishlist
  console.log('2. Testing Student Add to Wishlist (POST /api/wishlist)...');
  const addRes = await fetch(`${BASE_URL}/api/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + studentToken },
    body: JSON.stringify({ bookId: testBook._id.toString() }),
  });
  const addData = await addRes.json();
  console.log('   Status:', addRes.status, 'Message:', addData.message);
  if (addRes.status !== 201) throw new Error('Student failed to add book to wishlist');
  if (!addData.data?.book?.title || !addData.data?.book?.availableCopies) {
    throw new Error('Wishlist item did not populate book details properly');
  }
  console.log('   Populated book details:', {
    title: addData.data.book.title,
    author: addData.data.book.author,
    category: addData.data.book.category,
    availableCopies: addData.data.book.availableCopies,
    coverImageUrl: addData.data.book.coverImageUrl || addData.data.book.coverImage,
  });

  // 3. Student tries to add the same book again (Duplicate prevention)
  console.log('3. Testing Duplicate Entry Prevention...');
  const dupRes = await fetch(`${BASE_URL}/api/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + studentToken },
    body: JSON.stringify({ bookId: testBook._id.toString() }),
  });
  const dupData = await dupRes.json();
  console.log('   Status (should be 400):', dupRes.status, 'Message:', dupData.message);
  if (dupRes.status !== 400) throw new Error('Duplicate wishlist entry was not rejected');

  // 4. Retrieve student's wishlist
  console.log('4. Testing Retrieve Wishlist (GET /api/wishlist)...');
  const getRes = await fetch(`${BASE_URL}/api/wishlist`, {
    headers: { Authorization: 'Bearer ' + studentToken },
  });
  const getData = await getRes.json();
  console.log('   Status:', getRes.status, 'Count:', getData.count);
  if (getRes.status !== 200 || !Array.isArray(getData.data)) throw new Error('Failed to retrieve wishlist');
  const savedItem = getData.data.find((item) => (item.book?._id || item.book) === testBook._id.toString());
  if (!savedItem) throw new Error('Added book not found in student wishlist');

  // 5. Remove book from wishlist
  console.log('5. Testing Remove from Wishlist (DELETE /api/wishlist/:bookId)...');
  const delRes = await fetch(`${BASE_URL}/api/wishlist/${testBook._id}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + studentToken },
  });
  const delData = await delRes.json();
  console.log('   Status:', delRes.status, 'Message:', delData.message);
  if (delRes.status !== 200) throw new Error('Failed to remove book from wishlist');

  // 6. Verify book was removed
  console.log('6. Verifying Wishlist after removal...');
  const verifyRes = await fetch(`${BASE_URL}/api/wishlist`, {
    headers: { Authorization: 'Bearer ' + studentToken },
  });
  const verifyData = await verifyRes.json();
  const stillExists = verifyData.data.some((item) => (item.book?._id || item.book) === testBook._id.toString());
  if (stillExists) throw new Error('Book still in wishlist after DELETE');
  console.log('   Confirmed: Book is no longer in wishlist.');

  // Clean up test data
  await Wishlist.deleteMany({ book: testBook._id });
  await Book.findByIdAndDelete(testBook._id);
  console.log('--- ALL PHASE B TESTS PASSED & CLEANED UP SUCCESSFULLY ---');

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
