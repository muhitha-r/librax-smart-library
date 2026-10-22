import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  BookOpen,
  Trash2,
  Bookmark,
  RefreshCw,
  Hash,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { fetchWishlist, removeFromWishlist, createBorrow, createReservation } from '../services/api';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWishlist();
      if (res?.data) {
        setWishlist(res.data);
      }
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchWishlist()
      .then((res) => {
        if (!ignore && res?.data) {
          setWishlist(res.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load wishlist', err);
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleRemove = async (bookId) => {
    try {
      await removeFromWishlist(bookId);
      setWishlist((prev) => prev.filter((item) => (item.book?._id || item.book) !== bookId));
      setActionMessage({ type: 'success', text: 'Book removed from wishlist.' });
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.customMessage || 'Failed to remove book.' });
    }
  };

  const handleBorrow = async (book) => {
    try {
      setProcessingId(book._id);
      const res = await createBorrow({ bookId: book._id });
      setActionMessage({
        type: 'success',
        text: res.message || `Successfully borrowed "${book.title}".`,
      });
      loadWishlist();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.customMessage || 'Borrow request failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReserve = async (book) => {
    try {
      setProcessingId(book._id);
      const res = await createReservation({ bookId: book._id });
      setActionMessage({
        type: 'success',
        text: res.message || `Successfully reserved "${book.title}".`,
      });
      loadWishlist();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.customMessage || 'Reservation failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/75 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Librax Student Station • Reading Wishlist</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <Heart className="w-5 h-5 fill-current" />
            </span>
            <span>My Reading Wishlist</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Saved course books, upcoming semester references, and fast borrow or reservation shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadWishlist}
            className="p-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#143527] transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      {/* Action Banner */}
      {actionMessage && (
        <div
          className={`mt-4 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Content */}
      <div className="mt-8">
        {loading && wishlist.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#D97706]" />
            <p className="text-sm text-[#6B7280]">Loading your saved titles...</p>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-sm">
            <Heart className="w-16 h-16 mx-auto mb-4 text-[#E5E7EB]" />
            <h3 className="text-lg font-bold text-[#1F2937]">
              Your wishlist is currently empty
            </h3>
            <p className="text-sm text-[#6B7280] mt-1 max-w-md mx-auto">
              Explore the library catalog to discover interesting books and click the heart icon to save them here.
            </p>
            <div className="mt-6">
              <Link
                to="/books"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md shadow-amber-600/20 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explore Books</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const book = item.book;
              if (!book) return null;
              const isAvailable = book.availableCopies > 0;
              const coverSrc = book.coverImageUrl || book.coverImage;

              return (
                <div
                  key={item._id}
                  className="bg-white border border-[#E5E7EB] hover:border-[#D97706]/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Cover Thumbnail */}
                    <div className="h-48 bg-[#1B4332]/5 relative overflow-hidden flex items-center justify-center">
                      {coverSrc ? (
                        <img
                          src={coverSrc}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#1B4332]">
                          <BookOpen className="w-10 h-10 mb-1 opacity-60" />
                          <span className="text-xs font-medium">Librax Catalog</span>
                        </div>
                      )}

                      <span
                        className={`absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                          isAvailable
                            ? 'bg-emerald-100 text-[#1B4332] border border-emerald-300/40'
                            : 'bg-red-100 text-red-800 border border-red-300/40'
                        }`}
                      >
                        {isAvailable ? `${book.availableCopies} Available` : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <span className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wider">
                        {book.category}
                      </span>
                      <h3
                        className="text-base font-bold text-[#1F2937] line-clamp-1 mt-1 group-hover:text-[#D97706] transition-colors"
                        title={book.title}
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] mt-0.5 line-clamp-1">
                        by <span className="font-medium text-[#1F2937]">{book.author}</span>
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-3 bg-[#F9F9F6] border border-[#E5E7EB]/60 p-2 rounded-lg font-mono text-[11px]">
                        <Hash className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{book.ISBN}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex items-center gap-2 border-t border-[#E5E7EB] mt-2">
                    {isAvailable ? (
                      <button
                        type="button"
                        disabled={processingId === book._id}
                        onClick={() => handleBorrow(book)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-all cursor-pointer disabled:opacity-60"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Borrow Now</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={processingId === book._id}
                        onClick={() => handleReserve(book)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#143527] shadow-sm transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Reserve Book</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemove(book._id)}
                      className="p-2 text-[#6B7280] hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

