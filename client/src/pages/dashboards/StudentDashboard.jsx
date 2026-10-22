import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyBorrowings,
  fetchMyReservations,
  fetchWishlist,
  removeFromWishlist,
  cancelReservation,
} from '../../services/api';
import {
  GraduationCap,
  BookOpen,
  Bookmark,
  Search,
  CheckCircle2,
  ArrowRight,
  Heart,
  Coins,
  Calendar,
  Trash2,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState('');

  // Live user state
  const [activeLoans, setActiveLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Wishlist
  const [wishlist, setWishlist] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const [borrowRes, resRes, wishRes] = await Promise.all([
          fetchMyBorrowings({ status: 'active' }),
          fetchMyReservations(),
          fetchWishlist(),
        ]);
        if (borrowRes.data) setActiveLoans(borrowRes.data);
        if (borrowRes.summary) setSummary(borrowRes.summary);
        if (resRes.data) setReservations(resRes.data);
        if (wishRes.data) setWishlist(wishRes.data);
      } catch (err) {
        console.error('Failed to load student borrowing data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  const handleRemoveWishlist = async (bookId, title) => {
    try {
      await removeFromWishlist(bookId);
      setWishlist((prev) => prev.filter((w) => (w.book?._id || w.book) !== bookId));
      setNotice(`'${title}' removed from your wishlist.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelReservation = async (reservationId, title) => {
    if (!window.confirm(`Are you sure you want to cancel your reservation for "${title || 'this book'}"?`)) {
      return;
    }
    try {
      await cancelReservation(reservationId);
      setReservations((prev) => prev.filter((r) => r._id !== reservationId));
      setNotice(`Reservation for "${title || 'Book'}" has been cancelled.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      console.error(err);
      setNotice(err.customMessage || 'Failed to cancel reservation.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/books?search=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/books');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Welcome Hero */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#143527] to-[#081C15] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#1B4332]/20 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2.5 shadow-sm">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Librax Student Station • Course Reserves & Loans</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Student Course Reserves & Loan Desk
            </h1>
            <p className="text-stone-300 text-xs mt-1 max-w-xl">
              Welcome, {user?.name || 'Student'}. Monitor your borrowed course textbooks (14-day loan quota: 4 items), track due dates to prevent daily ₹5 fines, and manage queue reservations.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md transition-all text-xs"
            >
              <Search className="w-4 h-4" />
              <span>Explore Book Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-xs text-stone-300">
              Student ID: <strong>{user?.email}</strong>
            </span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-semibold text-[#D97706] hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Loans
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" /> : `${summary?.activeLoans || activeLoans.length} / 4`}
          </p>
          <Link to="/borrow" className="text-xs text-[#D97706] hover:underline mt-1 inline-block font-semibold">
            Manage Loans (14-Day Terms) →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Reading Wishlist
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">{wishlist.length}</p>
          <p className="text-xs text-rose-600 mt-1 font-medium">
            Saved for Next Reading
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Holds
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#1B4332]" /> : reservations.length}
          </p>
          <Link to="/reservations" className="text-xs text-[#1B4332] hover:underline mt-1 inline-block font-semibold">
            View Book Reservations →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Fines
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" /> : `₹${summary?.totalUnpaidFines || 0}`}
          </p>
          <p className="text-xs text-emerald-700 mt-1 font-medium">
            {summary?.totalUnpaidFines > 0 ? 'Payment required' : 'Zero outstanding balance'}
          </p>
        </div>
      </div>

      {/* 3. Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Loans & Wishlist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Loans */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#1B4332]" />
                <span>My Active Course Loans ({activeLoans.length})</span>
              </h2>
              <Link to="/borrow" className="text-xs font-semibold text-[#D97706] hover:underline">
                View Loans Desk →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center text-[#1B4332]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : activeLoans.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No textbooks currently borrowed.</p>
                <Link
                  to="/books"
                  className="mt-2 text-xs font-semibold text-[#D97706] hover:underline inline-block"
                >
                  Explore library catalog to borrow books →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeLoans.map((l) => {
                  const dueDate = new Date(l.dueDate);
                  const isOverdue = new Date() > dueDate;
                  return (
                    <div
                      key={l._id}
                      className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <h3 className="font-semibold text-sm text-[#0F172A]">
                          {l.book?.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>ISBN: {l.book?.ISBN}</span>
                          <span>•</span>
                          <span
                            className={`flex items-center gap-1 font-medium ${
                              isOverdue ? 'text-rose-600' : 'text-[#D97706]'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {dueDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                            isOverdue
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                        <Link
                          to="/borrow"
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <RotateCcw className="w-3 h-3" /> Return
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Book Reservations & Holds Queue */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#1B4332]" />
                <span>My Book Reservations & Hold Queue ({reservations.length})</span>
              </h2>
              <Link to="/reservations" className="text-xs font-semibold text-[#D97706] hover:underline">
                View All Holds →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center text-[#1B4332]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No active book reservations or holds in queue.</p>
                <Link
                  to="/books"
                  className="mt-2 text-xs font-semibold text-[#D97706] hover:underline inline-block"
                >
                  Browse catalog to reserve unavailable titles →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((r) => {
                  const isReady = r.status === 'Available';
                  const isWaiting = ['Waiting', 'Pending'].includes(r.status);
                  const isCancelable = ['Waiting', 'Pending', 'Available'].includes(r.status);
                  const book = r.book;

                  return (
                    <div
                      key={r._id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isReady
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-slate-50/70 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                          {book?.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[#0F172A]">
                              {book?.title || 'Unknown Title'}
                            </h3>
                            {isReady && (
                              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Ready for Pickup
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-0.5">
                            by {book?.author || 'Author'} • <span className="font-mono text-[11px]">{book?.ISBN}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                            {isWaiting ? (
                              <span className="font-semibold text-[#1B4332]">
                                Queue Position: #{r.queuePosition || 1} {r.queuePosition === 1 ? '(Next in line)' : ''}
                              </span>
                            ) : isReady ? (
                              <span className="font-semibold text-emerald-700">
                                Hold expires: {r.holdUntil ? new Date(r.holdUntil).toLocaleDateString() : '3 days'}
                              </span>
                            ) : (
                              <span>Status: {r.status}</span>
                            )}
                            <span>•</span>
                            <span>Reserved on: {new Date(r.reservedAt || r.reservationDate || r.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 sm:self-center">
                        {isWaiting && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30">
                            Queue #{r.queuePosition || 1}
                          </span>
                        )}
                        {isReady && (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Available Now
                          </span>
                        )}
                        {isCancelable && (
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(r._id, book?.title)}
                            className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-200"
                            title="Cancel reservation hold"
                          >
                            Cancel Hold
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reading Wishlist */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                <span>Reading Wishlist ({wishlist.length})</span>
              </h2>
              <Link to="/student/wishlist" className="text-xs font-semibold text-[#D97706] hover:underline">
                View Full Wishlist →
              </Link>
            </div>

            {wishlist.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Your wishlist is empty. Save books from the catalog!</p>
            ) : (
              <div className="space-y-3">
                {wishlist.map((w) => {
                  const book = w.book;
                  if (!book) return null;
                  return (
                    <div
                      key={w._id}
                      className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <h3 className="font-semibold text-sm text-[#0F172A]">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          by {book.author} • <span className="text-[#1B4332] font-medium">{book.category}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/books?search=${encodeURIComponent(book.ISBN || book.title)}`}
                          className="px-3 py-1 text-xs font-semibold text-[#1B4332] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Check Availability
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemoveWishlist(book._id, book.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Search & Rules */}
        <div className="space-y-6">
          {/* Quick Search Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
            <h2 className="text-base font-bold text-[#0F172A] mb-3 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#1B4332]" />
              <span>Find Books in Catalog</span>
            </h2>
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search title, author, or ISBN..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706]"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search Catalog</span>
              </button>
            </form>
          </div>

          {/* Student Borrowing Guidelines */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
            <h2 className="text-base font-bold text-[#0F172A] mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#1B4332]" />
              <span>Student Borrowing Rules</span>
            </h2>
            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Loan Duration:</strong> 14 days per textbook.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Maximum Items:</strong> Up to 4 active course titles simultaneously.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
                <span><strong className="text-[#0F172A]">Late Fine:</strong> ₹5 / day after due date.</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-200">
              <Link
                to="/borrow"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-50 text-[#1B4332] border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <span>Go to My Loans Page</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
