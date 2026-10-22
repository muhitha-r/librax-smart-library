import { useState } from 'react';
import { returnBook } from '../services/api';
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Coins,
  Loader2,
  BookOpen,
  User,
  Clock,
} from 'lucide-react';

export default function ReturnModal({ record, isOpen, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !record) return null;

  const now = new Date();
  const dueDate = new Date(record.dueDate);
  const isOverdue = now > dueDate;

  // Estimate overdue days and fine based on ₹5/day
  let overdueDays = 0;
  let estimatedFine = 0;
  if (isOverdue) {
    const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((nowMidnight.getTime() - dueMidnight.getTime()) / (1000 * 60 * 60 * 24));
    overdueDays = Math.max(1, diffDays);
    estimatedFine = overdueDays * 5;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await returnBook(record._id, {
        remarks: remarks.trim() || undefined,
      });
      if (onSuccess) {
        onSuccess(response.data, response.message);
      }
      onClose();
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to process return.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200">
              <RotateCcw className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Confirm Book Return
              </h2>
              <span className="text-xs text-slate-500">
                Librax Smart Circulation Desk
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Book & Borrower Details */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <BookOpen className="w-5 h-5 text-[#D97706]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#0F172A] truncate tracking-tight">
                  {record.book?.title || 'Unknown Title'}
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  by {record.book?.author || 'Unknown'} • ISBN: {record.book?.ISBN}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Borrower:</span>
              </span>
              <span className="font-semibold text-[#1F2937]">
                {record.user?.name} ({record.user?.role})
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Due Date:</span>
              </span>
              <span className="font-semibold text-[#1F2937]">
                {dueDate.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Overdue Status & Fine Assessment */}
          {isOverdue ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-red-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>Overdue Notice</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200 font-bold">
                  {overdueDays} Day(s) Overdue
                </span>
              </div>
              <p className="text-xs text-red-700">
                This item has exceeded its authorized loan duration. An overdue fee will be assessed upon return.
              </p>
              <div className="pt-2 border-t border-red-200 flex items-center justify-between text-sm font-bold text-red-900">
                <span>Calculated Late Fine:</span>
                <span className="text-base text-[#D97706]">₹{estimatedFine}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="font-semibold">Returning On Time</p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  No overdue fees applicable. Inventory will be atomically incremented upon confirmation.
                </p>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
              Return Condition / Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Returned in good condition"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Return...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Return</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
