import { useState } from 'react';
import { X, BookOpen, Calendar, Building, Hash, Bookmark, Heart, Edit3 } from 'lucide-react';

export default function BookModal({
  book,
  isOpen,
  onClose,
  onEdit,
  canManage,
  onBorrow,
  onReserve,
  isWishlisted,
  onToggleWishlist,
}) {
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !book) return null;

  const isAvailable = book.availableCopies > 0;
  const borrowedCount = Math.max(0, book.totalCopies - book.availableCopies);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1B4332] text-white">
              {book.category}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  : 'bg-red-50 text-red-800 border border-red-300'
              }`}
            >
              {isAvailable ? `${book.availableCopies} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(book)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                  }`}
                />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Book Cover */}
            <div className="w-full sm:w-44 h-60 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
              {book.coverImage && !imgError ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                  <BookOpen className="w-12 h-12 mb-2 text-[#1B4332]/40" />
                  <span className="text-xs">No Cover Image</span>
                </div>
              )}
            </div>

            {/* Core Info */}
            <div className="flex-1 space-y-3">
              <h2 className="text-2xl font-bold text-[#0F172A] leading-snug tracking-tight">
                {book.title}
              </h2>
              <p className="text-base text-slate-600">
                by <strong className="text-[#0F172A]">{book.author}</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    ISBN
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#D97706]" />
                    {book.ISBN}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
                    Publication
                  </span>
                  <span className="text-xs font-semibold text-[#0F172A] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1B4332]" />
                    {book.publicationYear || 'N/A'}
                  </span>
                </div>

                {book.publisher && (
                  <div className="p-3 bg-[#F9F9F6] border border-[#E5E7EB] rounded-xl col-span-2">
                    <span className="block text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold mb-1">
                      Publisher
                    </span>
                    <span className="text-xs font-semibold text-[#1F2937] flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-[#1B4332]" />
                      {book.publisher}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description ? (
            <div>
              <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                Synopsis / Description
              </h4>
              <p className="text-sm text-[#1F2937] leading-relaxed bg-[#F9F9F6] p-4 rounded-2xl border border-[#E5E7EB]">
                {book.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] italic">No description provided for this catalog entry.</p>
          )}

          {/* Circulation Status info */}
          <div className="p-4 bg-[#FFFBEB] border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-[#78350F]">
            <span>
              Total in Catalog: <strong>{book.totalCopies}</strong> | Currently on loan:{' '}
              <strong>{borrowedCount}</strong>
            </span>
            <span>
              Available for checkout: <strong>{book.availableCopies}</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#E5E7EB] flex items-center justify-between bg-[#F9F9F6]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[#6B7280] hover:text-[#1F2937] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={() => onToggleWishlist(book)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  isWishlisted
                    ? 'border-rose-300 bg-rose-50 text-rose-700'
                    : 'border-[#E5E7EB] bg-white text-[#1F2937] hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
              </button>
            )}

            {isAvailable ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBorrow && onBorrow(book);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Borrow Book</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReserve && onReserve(book);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#081C15] shadow-md transition-all cursor-pointer border border-[#2D6A4F]"
              >
                <Bookmark className="w-4 h-4 text-[#D97706]" />
                <span>Reserve Book</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(book);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1B4332] hover:bg-[#081C15] shadow-md transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Book</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
