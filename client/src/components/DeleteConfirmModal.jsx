import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, book, loading }) {
  if (!isOpen || !book) return null;

  const borrowedCount = Math.max(0, book.totalCopies - book.availableCopies);
  const isBorrowed = borrowedCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0 border border-rose-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-[#0F172A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-[#0F172A] mb-2 tracking-tight">
          Delete Book from Catalog?
        </h3>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-1">
          <p className="font-semibold text-[#0F172A] truncate">
            {book.title}
          </p>
          <p className="text-[#6B7280]">Author: {book.author}</p>
          <p className="font-mono text-[#6B7280]">ISBN: {book.ISBN}</p>
        </div>

        {isBorrowed ? (
          <div className="p-3 bg-[#FFFBEB] border border-amber-200 rounded-xl mb-6 text-xs text-[#78350F]">
            <p className="font-semibold mb-0.5">Active Loan Warning</p>
            <p>
              This book currently has <strong>{borrowedCount} copy/copies</strong> checked out by library patrons. It cannot be deleted until all borrowed copies are returned.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] mb-6">
            Are you sure you want to remove this book from the Librax library catalog? This action cannot be undone.
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(book._id)}
            disabled={loading || isBorrowed}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Book</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
