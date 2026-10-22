import { useState } from 'react';
import { BookOpen, Edit3, Trash2, Eye, Hash, Bookmark, Heart } from 'lucide-react';

export default function BookCard({
  book,
  canManage,
  onView,
  onEdit,
  onDelete,
  onBorrow,
  onReserve,
  isWishlisted,
  onToggleWishlist,
}) {
  const [imgError, setImgError] = useState(false);

  const isAvailable = book.availableCopies > 0;
  const borrowedCount = Math.max(0, book.totalCopies - book.availableCopies);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col group overflow-hidden">
      {/* Cover Image / Thumbnail Header */}
      <div className="relative h-44 bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden flex items-center justify-center">
        {book.coverImage && !imgError ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#94A3B8] p-4">
            <BookOpen className="w-10 h-10 mb-1 text-[#1B4332]/40" />
            <span className="text-[11px] font-medium text-[#64748B]">Central Library OPAC</span>
          </div>
        )}

        {/* Category Department Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1B4332] text-white shadow-sm border border-[#2D6A4F]">
            <Bookmark className="w-2.5 h-2.5 text-[#D97706]" />
            {book.category}
          </span>
        </div>

        {/* Wishlist toggle & Stock Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(book);
              }}
              className="p-1 rounded-full bg-white shadow-sm hover:scale-110 transition-transform cursor-pointer border border-[#E2E8F0]"
              title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-label="Wishlist toggle"
            >
              <Heart
                className={`w-3 h-3 ${
                  isWishlisted
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-[#64748B] hover:text-rose-500'
                }`}
              />
            </button>
          )}

          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold shadow-sm ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}
          >
            {isAvailable ? `${book.availableCopies} Available` : 'Issued (Queue)'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3
            className="text-xs sm:text-sm font-bold text-[#0F172A] line-clamp-1 mb-0.5 group-hover:text-[#D97706] transition-colors"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-[11px] text-[#64748B] line-clamp-1 mb-2">
            by <span className="font-semibold text-[#0F172A]">{book.author}</span>
          </p>

          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mb-2.5 bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-1 rounded-lg">
            <Hash className="w-3 h-3 text-[#D97706]" />
            <span className="font-mono text-[10px] font-medium text-[#0F172A]">{book.ISBN}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-3">
            <span>
              Total Stock: <strong className="text-[#0F172A]">{book.totalCopies}</strong>
            </span>
            {borrowedCount > 0 && (
              <span className="text-[#D97706] font-semibold">
                {borrowedCount} Issued
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => onView(book)}
            className="inline-flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold text-[#0F172A] bg-[#F8FAFC] hover:bg-slate-200 border border-[#E2E8F0] transition-colors cursor-pointer"
          >
            <Eye className="w-3 h-3 text-[#64748B]" />
            <span>Details</span>
          </button>

          {/* Borrow or Reserve Button */}
          {isAvailable ? (
            <button
              type="button"
              onClick={() => onBorrow && onBorrow(book)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-all cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Borrow</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onReserve && onReserve(book)}
              className="flex-1 inline-flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold text-white bg-[#1B4332] hover:bg-[#081C15] shadow-sm transition-all cursor-pointer border border-[#2D6A4F]"
            >
              <Bookmark className="w-3 h-3 text-[#D97706]" />
              <span>Reserve</span>
            </button>
          )}

          {canManage && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onEdit(book)}
                className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                title="Edit Book Record"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(book)}
                className="inline-flex items-center justify-center p-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                title="Delete Book Record"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
