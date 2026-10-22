const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const mongoose = require('mongoose');
const Book = require('../server/models/Book');
const BorrowRecord = require('../server/models/BorrowRecord');
const Reservation = require('../server/models/Reservation');

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const totalBooks = await Book.countDocuments();
  console.log('Total Books count:', totalBooks);

  const categories = await Book.distinct('category');
  console.log('Distinct Categories:', categories);

  const borrowRecordsCount = await BorrowRecord.countDocuments();
  console.log('Total BorrowRecords count:', borrowRecordsCount);

  const reservationsCount = await Reservation.countDocuments();
  console.log('Total Reservations count:', reservationsCount);

  // Check duplicate ISBNs or titles
  const duplicates = await Book.aggregate([
    {
      $group: {
        _id: '$title',
        count: { $sum: 1 },
        ids: { $push: '$_id' },
        isbns: { $push: '$ISBN' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log('Duplicate titles count:', duplicates.length);
  duplicates.slice(0, 10).forEach(d => {
    console.log(`Title: "${d._id}" - Count: ${d.count}`);
  });

  // Inspect any Quantum Computing repetitive books
  const qcBooks = await Book.find({ title: /Quantum/i }).select('title ISBN category');
  console.log('Quantum books count:', qcBooks.length);
  qcBooks.slice(0, 5).forEach(b => console.log('QC book:', b.title, b.ISBN));

  await mongoose.disconnect();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
