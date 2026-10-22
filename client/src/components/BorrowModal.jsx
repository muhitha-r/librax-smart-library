import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createBorrow, fetchUsers } from '../services/api';
import {
  X,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
} from 'lucide-react';

export default function BorrowModal({ book, isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For Admin/Librarian: load users list to issue book to
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const isPrivileged = user?.role === 'Admin' || user?.role === 'Librarian';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setRemarks('');
      setCustomDueDate('');
      if (isPrivileged) {
        setTargetUserId(user?._id || '');
        loadUsers();
      } else {
        setTargetUserId(user?._id || '');
      }
    }
  }, [isOpen, user]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetchUsers({ limit: 100 });
      if (res.data) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.error('Failed to load users for issue modal:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  if (!isOpen || !book) return null;

  // Selected target user details
  const selectedUser = isPrivileged
    ? usersList.find((u) => u._id === targetUserId) || user
    : user;

  const defaultDurationDays = selectedUser?.role === 'Staff' ? 30 : 14;
  const estimatedDueDate = new Date(Date.now() + defaultDurationDays * 24 * 60 * 60 * 1000)
    .toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        bookId: book._id,
        remarks: remarks.trim() || undefined,
      };

      if (isPrivileged && targetUserId) {
        payload.userId = targetUserId;
        if (customDueDate) {
          payload.dueDate = new Date(customDueDate).toISOString();
        }
      }

      const response = await createBorrow(payload);
      if (onSuccess) {
        onSuccess(response.data, response.message);
      }
      onClose();
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to borrow book.');
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
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center border border-emerald-100">
              <BookOpen className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Issue / Borrow Book
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Book Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4">
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-16 h-20 object-cover rounded-xl border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-20 rounded-xl bg-emerald-50 text-[#1B4332] flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-8 h-8 text-[#D97706]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1B4332]">
                {book.category}
              </span>
              <h3 className="text-sm font-bold text-[#0F172A] truncate tracking-tight">
                {book.title}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                by {book.author}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                <span className="font-mono">ISBN: {book.ISBN}</span>
                <span className="text-emerald-700 font-semibold">
                  {book.availableCopies} available
                </span>
              </div>
            </div>
          </div>

          {/* Target Borrower Selection (for Librarian & Admin) */}
          {isPrivileged && (
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Issue To (Member Account)
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                disabled={loadingUsers}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706] cursor-pointer"
              >
                <option value={user?._id}>Myself ({user?.name} - {user?.role})</option>
                {usersList
                  .filter((u) => u._id !== user?._id)
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email}) — [{u.role}]
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Loan Duration & Policy Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#EBF7EE] border border-[#D8F3DC]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4332] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Loan Duration</span>
              </div>
              <p className="text-xs text-[#143527]">
                <strong>{defaultDurationDays} days</strong> ({selectedUser?.role || 'Member'} tier)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FFFBEB] border border-amber-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#92400E] mb-1">
                <Coins className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Overdue Rate</span>
              </div>
              <p className="text-xs text-[#78350F]">
                <strong>₹5 / day</strong> if returned late
              </p>
            </div>
          </div>

          {/* Expected Due Date Indicator */}
          <div className="p-3.5 rounded-xl bg-[#F9F9F6] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#1F2937]">
            <span className="flex items-center gap-1.5 text-[#6B7280]">
              <Calendar className="w-4 h-4 text-[#1B4332]" />
              <span>Calculated Due Date:</span>
            </span>
            <span className="font-bold text-[#1F2937]">{estimatedDueDate}</span>
          </div>

          {/* Optional Custom Due Date (Admin/Librarian override) */}
          {isPrivileged && (
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
                Custom Due Date (Optional Override)
              </label>
              <input
                type="date"
                value={customDueDate}
                onChange={(e) => setCustomDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-[#D97706]"
              />
              <span className="text-[11px] text-[#6B7280] mt-1 block">
                Leave blank to automatically apply default policy duration.
              </span>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
              Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Standard course reading copy"
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
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Checkout</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
