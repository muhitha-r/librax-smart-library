import { useState } from 'react';
import { payOrWaiveFine } from '../services/api';
import {
  X,
  Coins,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  User,
  BookOpen,
} from 'lucide-react';

export default function PayFineModal({ record, isOpen, onClose, onSuccess }) {
  const [action, setAction] = useState('Pay'); // 'Pay' | 'Waive'
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await payOrWaiveFine(record._id, {
        action,
        remarks: remarks.trim() || undefined,
      });
      if (onSuccess) {
        onSuccess(response.data, response.message);
      }
      onClose();
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to process fine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200/80 rounded-xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200">
              <Coins className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Settle Overdue Fine
              </h2>
              <span className="text-xs text-slate-500">
                Desk Cashier & Account Balance
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors cursor-pointer"
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

          {/* Record Summary */}
          <div className="p-4 rounded-2xl bg-[#F9F9F6] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Book:</span>
              </span>
              <span className="font-semibold text-[#1F2937] truncate max-w-[200px]">
                {record.book?.title}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Borrower:</span>
              </span>
              <span className="font-semibold text-[#1F2937]">
                {record.user?.name} ({record.user?.role})
              </span>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-sm font-bold text-[#1F2937]">
              <span>Outstanding Fine:</span>
              <span className="text-lg text-[#D97706]">
                ₹{record.fineAmount}
              </span>
            </div>
          </div>

          {/* Action Choice: Pay or Waive */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-2">
              Resolution Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAction('Pay')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  action === 'Pay'
                    ? 'border-[#D97706] bg-[#FFFBEB] text-[#92400E] shadow-sm'
                    : 'border-[#E5E7EB] hover:bg-[#F9F9F6] text-[#1F2937]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <CheckCircle2 className={`w-4 h-4 ${action === 'Pay' ? 'text-[#D97706]' : 'text-gray-400'}`} />
                  <span>Record Payment</span>
                </div>
                <span className="text-[11px] text-[#6B7280] block">
                  Mark ₹{record.fineAmount} as received.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAction('Waive')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  action === 'Waive'
                    ? 'border-[#1B4332] bg-[#EBF7EE] text-[#1B4332] shadow-sm'
                    : 'border-[#E5E7EB] hover:bg-[#F9F9F6] text-[#1F2937]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  <ShieldCheck className={`w-4 h-4 ${action === 'Waive' ? 'text-[#1B4332]' : 'text-gray-400'}`} />
                  <span>Waive Fine</span>
                </div>
                <span className="text-[11px] text-[#6B7280] block">
                  Forgive ₹{record.fineAmount} balance.
                </span>
              </button>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
              Receipt / Exemption Note (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={action === 'Pay' ? 'e.g. Paid in cash at desk' : 'e.g. Authorized medical leave'}
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
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer ${
                action === 'Pay'
                  ? 'bg-[#D97706] hover:bg-[#B45309]'
                  : 'bg-[#1B4332] hover:bg-[#081C15]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm {action === 'Pay' ? 'Payment' : 'Waiver'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
