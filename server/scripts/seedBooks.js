const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');

const sampleBooks = [
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    ISBN: '978-0132350884',
    author: 'Robert C. Martin',
    category: 'Computer Science',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. This book is a must for any developer, software engineer, project manager, team lead, or systems analyst.',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e37b29?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 5,
  },
  {
    title: 'The Pragmatic Programmer: Your Journey to Mastery',
    ISBN: '978-0135957059',
    author: 'David Thomas, Andrew Hunt',
    category: 'Computer Science',
    publisher: 'Addison-Wesley Professional',
    publicationYear: 2019,
    description: 'The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process: taking a requirement and producing working, maintainable code.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: 'Introduction to Algorithms, Fourth Edition',
    ISBN: '978-0262046305',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    category: 'Computer Science',
    publisher: 'MIT Press',
    publicationYear: 2022,
    description: 'A comprehensive update of the leading algorithms text, with new material on matchings in bipartite graphs, online algorithms, machine learning, and other topics.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    ISBN: '978-0201633610',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    category: 'Computer Science',
    publisher: 'Addison-Wesley',
    publicationYear: 1994,
    description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.',
    coverImage: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=400',
    totalCopies: 5,
    availableCopies: 5,
  },
  {
    title: 'To Kill a Mockingbird',
    ISBN: '978-0061120084',
    author: 'Harper Lee',
    category: 'Literature',
    publisher: 'Harper Perennial Modern Classics',
    publicationYear: 1960,
    description: 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it. Compassionate, dramatic, and deeply moving.',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    totalCopies: 5,
    availableCopies: 3,
  },
  {
    title: '1984',
    ISBN: '978-0451524935',
    author: 'George Orwell',
    category: 'Literature',
    publisher: 'Signet Classic',
    publicationYear: 1949,
    description: 'The classic dystopian novel exploring totalitarianism, mass surveillance, and repressive regimentation of persons and behaviours within society.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    totalCopies: 7,
    availableCopies: 7,
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    ISBN: '978-0062316097',
    author: 'Yuval Noah Harari',
    category: 'History',
    publisher: 'Harper',
    publicationYear: 2014,
    description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution that explores the ways in which biology and history have defined us.',
    coverImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },
  {
    title: 'A Brief History of Time',
    ISBN: '978-0553380163',
    author: 'Stephen Hawking',
    category: 'Science',
    publisher: 'Bantam Books',
    publicationYear: 1988,
    description: 'A landmark volume in science writing by one of the great minds of our time, exploring profound questions about the universe, space, time, and black holes.',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400',
    totalCopies: 4,
    availableCopies: 4,
  },
  {
    title: 'Deep Work: Rules for Focused Success in a Distracted World',
    ISBN: '978-1455586691',
    author: 'Cal Newport',
    category: 'Business',
    publisher: 'Grand Central Publishing',
    publicationYear: 2016,
    description: 'Deep work is the ability to focus without distraction on a cognitively demanding task. It is a super power in our increasingly competitive economy.',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400',
    totalCopies: 5,
    availableCopies: 5,
  },
  {
    title: 'Linear Algebra and Its Applications',
    ISBN: '978-0321982384',
    author: 'David C. Lay, Steven R. Lay, Judi J. McDonald',
    category: 'Mathematics',
    publisher: 'Pearson',
    publicationYear: 2015,
    description: 'Linear algebra is relatively easy for students during the early stages of the course, when the material is presented in a familiar, concrete setting.',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400',
    totalCopies: 4,
    availableCopies: 2,
  },
];

async function seedBooks() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('Error: MONGODB_URI missing.');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');

    let addedCount = 0;
    for (const book of sampleBooks) {
      const exists = await Book.findOne({ ISBN: book.ISBN });
      if (!exists) {
        await Book.create(book);
        addedCount++;
        console.log(`+ Seeded: ${book.title}`);
      }
    }

    console.log(`Seeding complete. Added ${addedCount} new books.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding books failed:', error);
    process.exit(1);
  }
}

seedBooks();

