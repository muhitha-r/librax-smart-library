const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Book = require('../models/Book');
const Reservation = require('../models/Reservation');
const BorrowRecord = require('../models/BorrowRecord');
const Notification = require('../models/Notification');
const { generateToken } = require('../utils/jwt');

async function runTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('--- TESTING PHASE A: BOOK RESERVATION QUEUE ---');

  // Create test book with availableCopies = 0
  const testBook = await Book.create({
    title: 'Test Out-of-Stock Book ' + Date.now(),
    ISBN: 'TEST-' + Date.now(),
    author: 'Test Author',
    category: 'Computer Science',
    totalCopies: 1,
    availableCopies: 0,
  });
  console.log('Created test book with availableCopies = 0:', testBook.title);

  // Find two student users
  const student1 = await User.findOne({ email: 'student@librax.com' });
  const student2 = await User.findOne({ role: 'Student', _id: { $ne: student1._id } });
  const token1 = generateToken(student1);
  const token2 = generateToken(student2);

  const BASE_URL = 'http://localhost:5000';

  // 1. Student 1 reserves testBook (availableCopies = 0)
  const res1 = await fetch(BASE_URL + '/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token1 },
    body: JSON.stringify({ bookId: testBook._id.toString() }),
  });
  const data1 = await res1.json();
  console.log('1. Student 1 reservation status:', res1.status, 'Queue position:', data1.data?.queuePosition);
  if (res1.status !== 201 || data1.data?.queuePosition !== 1) throw new Error('Student 1 reservation failed');

  // 2. Student 1 tries duplicate reservation
  const dupRes = await fetch(BASE_URL + '/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token1 },
    body: JSON.stringify({ bookId: testBook._id.toString() }),
  });
  const dupData = await dupRes.json();
  console.log('2. Duplicate reservation status:', dupRes.status, dupData.message);
  if (dupRes.status !== 400) throw new Error('Duplicate reservation should be rejected');

  // 3. Student 2 reserves testBook
  const res2 = await fetch(BASE_URL + '/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token2 },
    body: JSON.stringify({ bookId: testBook._id.toString() }),
  });
  const data2 = await res2.json();
  console.log('3. Student 2 reservation status:', res2.status, 'Queue position:', data2.data?.queuePosition);
  if (res2.status !== 201 || data2.data?.queuePosition !== 2) throw new Error('Student 2 queue position should be 2');

  // 4. Try reserving an available book (should fail)
  const availBook = await Book.findOne({ availableCopies: { $gt: 0 } });
  if (availBook) {
    const availRes = await fetch(BASE_URL + '/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token1 },
      body: JSON.stringify({ bookId: availBook._id.toString() }),
    });
    const availData = await availRes.json();
    console.log('4. Reserve available book status (should be 400):', availRes.status, availData.message);
    if (availRes.status !== 400) throw new Error('Reserving available book should fail');
  }

  // 5. Test Return logic: simulate a borrow return for testBook
  const dummyBorrow = await BorrowRecord.create({
    user: student1._id,
    book: testBook._id,
    borrowDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'Borrowed',
  });

  const returnRes = await fetch(BASE_URL + '/api/borrow/' + dummyBorrow._id + '/return', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token1 },
  });
  const returnData = await returnRes.json();
  console.log('5. Return book status:', returnRes.status, returnData.message);

  // Check Student 1 reservation status: should now be 'Available' with holdUntil
  const s1Res = await Reservation.findById(data1.data._id);
  console.log('5b. Student 1 reservation updated status:', s1Res.status, 'Hold until:', s1Res.holdUntil);
  if (s1Res.status !== 'Available' || !s1Res.holdUntil) throw new Error('Student 1 reservation should be Available with hold');

  // Check notification was sent to Student 1
  const notif = await Notification.findOne({ user: student1._id, type: 'Reservation' }).sort({ createdAt: -1 });
  console.log('5c. In-app notification created:', notif?.title, '->', notif?.message);

  // 6. Test cancellation: Student 2 cancels their reservation
  const cancelRes = await fetch(BASE_URL + '/api/reservations/' + data2.data._id + '/cancel', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token2 },
  });
  const cancelData = await cancelRes.json();
  console.log('6. Cancellation status:', cancelRes.status, cancelData.message);
  const s2Res = await Reservation.findById(data2.data._id);
  console.log('6b. Student 2 reservation status after cancel:', s2Res.status);
  if (s2Res.status !== 'Cancelled') throw new Error('Student 2 reservation should be Cancelled');

  // Clean up test data
  await Reservation.deleteMany({ book: testBook._id });
  await BorrowRecord.deleteMany({ book: testBook._id });
  await Notification.deleteMany({ relatedId: { $in: [data1.data._id, data2.data._id] } });
  await Book.findByIdAndDelete(testBook._id);
  console.log('--- ALL PHASE A TESTS PASSED & CLEANED UP SUCCESSFULLY ---');

  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
