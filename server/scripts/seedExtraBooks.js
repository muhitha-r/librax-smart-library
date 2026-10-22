const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');

// 20 Diverse Non-Engineering Books
// Physics (4), Chemistry (4), Aptitude (4), General Knowledge (4), Literature (4)
const extraBooks = [
  // 1. Engineering Physics (First Year) - 4 Titles
  {
    title: 'Concepts of Modern Physics, Sixth Edition',
    ISBN: '978-0070151550',
    author: 'Arthur Beiser',
    category: 'Physics',
    publisher: 'McGraw-Hill',
    publicationYear: 2002,
    description: 'A comprehensive introduction to modern physics covering relativity, quantum mechanics, atomic structure, nuclear physics, and elementary particles.',
    coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80&w=400',
    totalCopies: 7,
    availableCopies: 5,
  },
  {
    title: 'Engineering Physics',
    ISBN: '978-8189928223',
    author: 'R.K. Gaur, S.L. Gupta',
    category: 'Physics',
    publisher: 'Dhanpat Rai Publications',
    publicationYear: 2018,
    description: 'Essential first-year engineering physics textbook detailing wave optics, lasers, fiber optics, electromagnetism, and quantum mechanics.',
    coverImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: 'Optics, Sixth Edition',
    ISBN: '978-9339220907',
    author: 'Ajoy Ghatak',
    category: 'Physics',
    publisher: 'McGraw-Hill',
    publicationYear: 2017,
    description: 'In-depth treatment of geometrical optics, wave optics, diffraction, polarization, coherence, lasers, holography, and fiber optics.',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },
  {
    title: 'Solid State Physics, Eighth Edition',
    ISBN: '978-9386649386',
    author: 'S.O. Pillai',
    category: 'Physics',
    publisher: 'New Age International',
    publicationYear: 2018,
    description: 'Foundational reference for crystal physics, electrical conduction in metals, dielectric properties, superconductivity, and semiconductor devices.',
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 5,
  },

  // 2. Engineering Chemistry (First Year) - 4 Titles
  {
    title: 'Engineering Chemistry, Sixteenth Edition',
    ISBN: '978-8187433170',
    author: 'P.C. Jain, Monika Jain',
    category: 'Chemistry',
    publisher: 'Dhanpat Rai',
    publicationYear: 2016,
    description: 'Comprehensive first-year chemistry textbook covering water treatment, fuels and combustion, corrosion science, lubricants, polymers, and green chemistry.',
    coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: 'Textbook of Engineering Chemistry, Twelfth Edition',
    ISBN: '978-8121903592',
    author: 'S.S. Dara, S.S. Umare',
    category: 'Chemistry',
    publisher: 'S. Chand',
    publicationYear: 2014,
    description: 'Essential guide to industrial water conditioning, phase rule, electrochemistry, polymers, composite materials, and instrumental chemical analysis.',
    coverImage: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=400',
    totalCopies: 7,
    availableCopies: 5,
  },
  {
    title: 'Physical Chemistry, Eleventh Edition',
    ISBN: '978-0198769866',
    author: 'P.W. Atkins, Julio de Paula, James Keeler',
    category: 'Chemistry',
    publisher: 'Oxford University Press',
    publicationYear: 2018,
    description: 'The premier global reference on thermodynamics, quantum chemistry, molecular spectroscopy, statistical mechanics, and chemical reaction kinetics.',
    coverImage: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },
  {
    title: 'Organic Chemistry, Sixth Edition',
    ISBN: '978-0136436690',
    author: 'Robert T. Morrison, Robert N. Boyd',
    category: 'Chemistry',
    publisher: 'Pearson',
    publicationYear: 1992,
    description: 'Monumental organic chemistry text introducing reaction mechanisms, stereochemistry, aliphatic and aromatic compounds, and biomolecules.',
    coverImage: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=400',
    totalCopies: 5,
    availableCopies: 3,
  },

  // 3. Aptitude & Reasoning - 4 Titles
  {
    title: 'Quantitative Aptitude for Competitive Examinations',
    ISBN: '978-9352534029',
    author: 'R.S. Aggarwal',
    category: 'Aptitude',
    publisher: 'S. Chand',
    publicationYear: 2017,
    description: 'The definitive aptitude manual for campus placements, GATE, CAT, and civil services, with thousands of solved examples covering arithmetic, algebra, and geometry.',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: 'A Modern Approach to Verbal & Non-Verbal Reasoning',
    ISBN: '978-9352832163',
    author: 'R.S. Aggarwal',
    category: 'Aptitude',
    publisher: 'S. Chand',
    publicationYear: 2018,
    description: 'Extensive practice and conceptual coverage of analytical reasoning, logical deductions, syllogisms, pattern matching, and spatial orientation.',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 5,
  },
  {
    title: 'Fast Track Objective Arithmetic',
    ISBN: '978-9312149836',
    author: 'Rajesh Verma',
    category: 'Aptitude',
    publisher: 'Arihant Publications',
    publicationYear: 2018,
    description: 'Speed mathematics techniques, mental calculations, fast arithmetic shortcuts, and topic-wise solved problems for competitive placement exams.',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400',
    totalCopies: 7,
    availableCopies: 5,
  },
  {
    title: 'How to Prepare for Quantitative Aptitude for CAT, Ninth Edition',
    ISBN: '978-9353160180',
    author: 'Arun Sharma',
    category: 'Aptitude',
    publisher: 'McGraw-Hill',
    publicationYear: 2021,
    description: 'High-level quantitative ability guide with 3 levels of difficulty (LOD), number systems, permutations & combinations, and modern data interpretation.',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },

  // 4. General Knowledge & History - 4 Titles
  {
    title: 'Manorama Yearbook 2026',
    ISBN: '978-9388753234',
    author: 'Mammen Mathew',
    category: 'General Knowledge',
    publisher: 'Malayala Manorama',
    publicationYear: 2025,
    description: 'Comprehensive compendium of global current affairs, science breakthroughs, world geography, governance, sports records, and annual milestones.',
    coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 5,
  },
  {
    title: "Lucent's General Knowledge, Tenth Edition",
    ISBN: '978-9384761547',
    author: 'Dr. Binay Karna',
    category: 'General Knowledge',
    publisher: 'Lucent Publications',
    publicationYear: 2023,
    description: 'Essential facts and reference notes on Indian history, constitution, economics, geography, and general science for students and exam aspirants.',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: "India After Gandhi: The History of the World's Largest Democracy",
    ISBN: '978-0060958589',
    author: 'Ramachandra Guha',
    category: 'General Knowledge',
    publisher: 'HarperCollins',
    publicationYear: 2008,
    description: 'Masterful historical chronicle of modern India from the aftermath of partition through linguistic reorganisation, political turbulence, and economic reform.',
    coverImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400',
    totalCopies: 5,
    availableCopies: 4,
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    ISBN: '978-0062316097',
    author: 'Yuval Noah Harari',
    category: 'General Knowledge',
    publisher: 'Harper',
    publicationYear: 2015,
    description: 'Provocative exploration of how Homo sapiens conquered the earth through the Cognitive, Agricultural, and Scientific Revolutions.',
    coverImage: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },

  // 5. Classic Literature & Story Books - 4 Titles
  {
    title: 'Wings of Fire: An Autobiography',
    ISBN: '978-8173711463',
    author: 'A.P.J. Abdul Kalam, Arun Tiwari',
    category: 'Literature',
    publisher: 'Universities Press',
    publicationYear: 1999,
    description: 'Inspiring life story of Dr. A.P.J. Abdul Kalam, detailing his journey from Rameswaram to leading India missile and space launch vehicle programs.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    totalCopies: 8,
    availableCopies: 6,
  },
  {
    title: 'The Alchemist',
    ISBN: '978-0062315007',
    author: 'Paulo Coelho',
    category: 'Literature',
    publisher: 'HarperOne',
    publicationYear: 1993,
    description: 'An inspiring allegorical novel following Santiago, an Andalusian shepherd boy who journeys to the pyramids of Egypt in search of his Personal Legend.',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    totalCopies: 7,
    availableCopies: 5,
  },
  {
    title: 'To Kill a Mockingbird',
    ISBN: '978-0061120084',
    author: 'Harper Lee',
    category: 'Literature',
    publisher: 'J.B. Lippincott & Co.',
    publicationYear: 1960,
    description: 'Pulitzer Prize-winning classic novel of racial injustice and the destruction of innocence in the American South, viewed through the eyes of Scout Finch.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },
  {
    title: 'The Great Gatsby',
    ISBN: '978-0743273565',
    author: 'F. Scott Fitzgerald',
    category: 'Literature',
    publisher: 'Charles Scribner\'s Sons',
    publicationYear: 1925,
    description: 'The quintessential portrait of the Jazz Age, wealth, obsession, and the illusion of the American Dream on Long Island in 1922.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400',
    totalCopies: 6,
    availableCopies: 4,
  },
];

async function seedExtraBooks() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      console.error('Error: MONGODB_URI or MONGO_URI is not set in environment variables.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected successfully to MongoDB Atlas.');

    // Enforce unique index check
    await Book.syncIndexes();
    console.log('Indexes synced successfully.');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const bookData of extraBooks) {
      const normalizedISBN = bookData.ISBN.trim().toUpperCase();
      const existing = await Book.findOne({ ISBN: normalizedISBN });

      if (existing) {
        // Update existing to prevent duplicate errors
        Object.assign(existing, bookData);
        existing.ISBN = normalizedISBN;
        await existing.save();
        updatedCount++;
      } else {
        await Book.create({
          ...bookData,
          ISBN: normalizedISBN,
        });
        insertedCount++;
      }
    }

    console.log(`\nResults: Inserted ${insertedCount} new books, updated ${updatedCount} existing books.`);

    const totalCount = await Book.countDocuments();
    const categories = await Book.distinct('category');

    console.log(`\nTotal Books in Atlas: ${totalCount}`);
    console.log('Distinct Categories in Atlas (', categories.length, '):');
    categories.sort().forEach(c => console.log('  -', c));

    await mongoose.disconnect();
    console.log('\nExtra books seeded successfully with zero errors.');
    process.exit(0);
  } catch (error) {
    console.error('\nFailed to seed extra books:', error);
    process.exit(1);
  }
}

// Export for use in seedEngineeringBooks or standalone
module.exports = { extraBooks, seedExtraBooks };

if (require.main === module) {
  seedExtraBooks();
}
