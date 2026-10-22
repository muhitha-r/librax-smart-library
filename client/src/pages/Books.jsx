import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchBooks,
  fetchCategories,
  createBook,
  updateBook,
  deleteBook,
  createReservation,
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../services/api';
import BookCard from '../components/BookCard';
import BookModal from '../components/BookModal';
import BookFormModal from '../components/BookFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import BorrowModal from '../components/BorrowModal';
import {
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  BookX,
  BookOpen,
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  'Computer Science',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Civil Engineering',
  'Mechanical Engineering',
  'Physics',
  'Chemistry',
  'Aptitude',
  'General Knowledge',
  'Literature',
];

export default function Books() {
  const { user } = useAuth();
  const canManage = user?.role === 'Admin' || user?.role === 'Librarian';

  // Catalog State
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState(STANDARD_CATEGORIES);
  const [wishlistBookIds, setWishlistBookIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Modals State
  const [selectedBook, setSelectedBook] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [borrowingBook, setBorrowingBook] = useState(null);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

  // Fetch Categories
  const loadCategories = async () => {
    try {
      const res = await fetchCategories();
      if (res?.data && res.data.length > 0) {
        const merged = Array.from(new Set([...STANDARD_CATEGORIES, ...res.data])).sort();
        setCategories(merged);
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  };

  // Fetch Books with current query params
  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
      };

      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (availability !== '') params.available = availability;

      const res = await fetchBooks(params);
      if (res?.data) {
        setBooks(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to fetch library books.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory, availability, sortBy]);



  useEffect(() => {
    let ignore = false;
    fetchCategories()
      .then((res) => {
        if (!ignore && res?.data && res.data.length > 0) {
          const merged = Array.from(new Set([...STANDARD_CATEGORIES, ...res.data])).sort();
          setCategories(merged);
        }
      })
      .catch((err) => {
        console.warn('Failed to load categories:', err);
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sort: sortBy,
    };

    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
    if (availability !== '') params.available = availability;

    fetchBooks(params)
      .then((res) => {
        if (!ignore && res?.data) {
          setBooks(res.data);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.customMessage || err.message || 'Failed to fetch library books.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [pagination.page, pagination.limit, searchTerm, selectedCategory, availability, sortBy]);

  useEffect(() => {
    if (user?.role !== 'Student') return;
    let ignore = false;
    fetchWishlist()
      .then((res) => {
        if (!ignore && res?.data) {
          const idSet = new Set(res.data.map((item) => item.book?._id || item.book));
          setWishlistBookIds(idSet);
        }
      })
      .catch((err) => {
        console.warn('Failed to load wishlist status:', err);
      });

    return () => {
      ignore = true;
    };
  }, [user]);

  // Toast auto-clear
  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setAvailability('');
    setSortBy('newest');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Wishlist Toggle
  const handleToggleWishlist = async (book) => {
    const bookId = book._id;
    const isCurrentlyWishlisted = wishlistBookIds.has(bookId);

    try {
      if (isCurrentlyWishlisted) {
        await removeFromWishlist(bookId);
        setWishlistBookIds((prev) => {
          const next = new Set(prev);
          next.delete(bookId);
          return next;
        });
        showToast(`Removed "${book.title}" from your wishlist.`);
      } else {
        await addToWishlist(bookId);
        setWishlistBookIds((prev) => new Set(prev).add(bookId));
        showToast(`Added "${book.title}" to your reading wishlist!`);
      }
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to update wishlist.');
      setTimeout(() => setError(null), 4000);
    }
  };

  // Modal Handlers
  const handleOpenView = (book) => {
    setSelectedBook(book);
    setIsViewModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingBook(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (book) => {
    setDeletingBook(book);
  };

  // Save Book (Create or Edit)
  const handleSaveBook = async (payload, id) => {
    if (id) {
      const res = await updateBook(id, payload);
      showToast(`"${res.data.title}" updated successfully.`);
    } else {
      const res = await createBook(payload);
      showToast(`"${res.data.title}" added to library catalog.`);
    }
    await loadBooks();
    await loadCategories();
  };

  // Confirm Delete
  const handleConfirmDelete = async (id) => {
    setDeleteLoading(true);
    try {
      const res = await deleteBook(id);
      setDeletingBook(null);
      showToast(res.message || 'Book deleted successfully.');
      await loadBooks();
      await loadCategories();
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to delete book.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Borrow & Reservation Handlers
  const handleOpenBorrow = (book) => {
    setBorrowingBook(book);
    setIsBorrowModalOpen(true);
  };

  const handleBorrowSuccess = (borrowRecord, message) => {
    showToast(message || `"${borrowRecord?.book?.title || 'Book'}" checked out successfully!`);
    loadBooks();
  };

  const handleReserveBook = async (book) => {
    try {
      const res = await createReservation({ bookId: book._id });
      showToast(res.message || `Reservation hold placed for "${book.title}".`);
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to place reservation.');
      setTimeout(() => setError(null), 4000);
    }
  };

  const hasActiveFilters = searchTerm || selectedCategory || availability !== '' || sortBy !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Elevated Header Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/75 backdrop-blur-md px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>{canManage ? 'Central Catalog & Inventory' : 'Institutional OPAC'}</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {pagination.total} Titles Available
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
              Central Library Book Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {canManage
                ? 'Catalog new book acquisitions, update accession metadata, and oversee institutional copies across engineering and academic disciplines.'
                : 'Search institutional textbook holdings, verify shelf availability, and place borrow or hold reservations.'}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catalog New Book</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-red-800 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadBooks}
            className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all p-4 sm:p-5 mb-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or ISBN..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div className="w-full sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all cursor-pointer"
              >
                <option value="">All Academic Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability Dropdown */}
            <div className="w-full sm:w-40">
              <select
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all cursor-pointer"
              >
                <option value="">All Stock Status</option>
                <option value="true">Available on Shelf</option>
                <option value="false">All Issued (Queue)</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-40">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all cursor-pointer"
              >
                <option value="newest">Recently Cataloged</option>
                <option value="oldest">Oldest First</option>
                <option value="title_asc">Title (A-Z)</option>
                <option value="title_desc">Title (Z-A)</option>
                <option value="author_asc">Author (A-Z)</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1B4332] hover:bg-[#081C15] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-colors cursor-pointer"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Book Grid / Loading / Empty */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-[#E5E7EB] rounded-2xl h-80 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="w-full h-40 bg-gray-100 rounded-xl mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
              <div className="h-8 bg-gray-100 rounded-xl mt-4" />
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCard
              key={book._id}
              book={book}
              canManage={canManage}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onBorrow={handleOpenBorrow}
              onReserve={handleReserveBook}
              isWishlisted={wishlistBookIds.has(book._id)}
              onToggleWishlist={user?.role === 'Student' ? handleToggleWishlist : undefined}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-xl p-10 text-center max-w-md mx-auto shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto mb-3 border border-emerald-100">
            <BookX className="w-7 h-7 text-[#D97706]" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A] mb-1 tracking-tight">
            No Book Records Found
          </h3>
          <p className="text-xs text-slate-500 mb-5">
            {hasActiveFilters
              ? 'No titles in the central catalog matched your query. Try broadening your parameters.'
              : 'No books have been cataloged yet.'}
          </p>

          <div className="flex items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#1B4332] bg-[#EBF7EE] hover:bg-[#D8F3DC] transition-colors border border-[#D8F3DC] cursor-pointer"
              >
                Clear Filters
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-colors cursor-pointer"
              >
                Catalog Book
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-[#E2E8F0]">
          <p className="text-xs text-[#64748B]">
            Showing <strong className="text-[#0F172A]">{books.length}</strong> of{' '}
            <strong className="text-[#0F172A]">{pagination.total}</strong> titles
            (Page {pagination.page} of {pagination.totalPages})
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.hasPrevPage || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#FFFBEB] text-[#92400E] border border-amber-200">
              {pagination.page} / {pagination.totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.hasNextPage || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BookModal
        book={selectedBook}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onEdit={handleOpenEdit}
        canManage={canManage}
        onBorrow={handleOpenBorrow}
        onReserve={handleReserveBook}
        isWishlisted={selectedBook ? wishlistBookIds.has(selectedBook._id) : false}
        onToggleWishlist={user?.role === 'Student' ? handleToggleWishlist : undefined}
      />

      <BorrowModal
        book={borrowingBook}
        isOpen={isBorrowModalOpen}
        onClose={() => {
          setIsBorrowModalOpen(false);
          setBorrowingBook(null);
        }}
        onSuccess={handleBorrowSuccess}
      />

      <BookFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveBook}
        initialData={editingBook}
        categories={categories}
      />

      <DeleteConfirmModal
        isOpen={!!deletingBook}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleConfirmDelete}
        book={deletingBook}
        loading={deleteLoading}
      />
    </div>
  );
}
