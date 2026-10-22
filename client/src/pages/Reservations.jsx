import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Bell,
  ArrowRight,
  Shield,
  BookOpen,
} from 'lucide-react';
import {
  fetchMyReservations,
  fetchAllReservations,
  cancelReservation,
  fulfillReservation,
  notifyReservation,
} from '../services/api';

export default function Reservations() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'Admin' || user?.role === 'Librarian';

  const [activeTab, setActiveTab] = useState(isPrivileged ? 'all' : 'my');
  const [reservations, setReservations] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMessage, setActionMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'all' && isPrivileged) {
        const params = {
          page,
          limit: 15,
          status: statusFilter !== 'All' ? statusFilter : undefined,
          search: search.trim() || undefined,
        };
        const res = await fetchAllReservations(params);
        if (res?.data) {
          setReservations(res.data);
          setMetrics(res.metrics);
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } else {
        const res = await fetchMyReservations();
        if (res?.data) {
          setReservations(res.data);
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleCancel = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel the reservation for "${title || 'this book'}"?`)) {
      return;
    }
    try {
      setProcessingId(id);
      const res = await cancelReservation(id);
      setActionMessage({ type: 'success', text: res.message || 'Reservation cancelled.' });
      loadData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.customMessage || 'Failed to cancel.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfill = async (id) => {
    try {
      setProcessingId(id);
      const res = await fulfillReservation(id);
      setActionMessage({ type: 'success', text: res.message || 'Reservation fulfilled.' });
      loadData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.customMessage || 'Failed to fulfill.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleNotify = async (id) => {
    try {
      setProcessingId(id);
      const res = await notifyReservation(id);
      setActionMessage({ type: 'success', text: res.message || 'User notified.' });
      loadData();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.customMessage || 'Failed to notify user.' });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5" /> Ready for Pickup
          </span>
        );
      case 'Waiting':
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30">
            <Clock className="w-3.5 h-3.5" /> In Queue
          </span>
        );
      case 'Fulfilled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
            <CheckCircle className="w-3.5 h-3.5" /> Fulfilled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-[#6B7280] border border-[#E5E7EB]">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Expired Hold
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/75 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2 shadow-sm">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>Central Library Circulation Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#D97706]/10 text-[#D97706]">
              <Bookmark className="w-5 h-5" />
            </span>
            <span>Book Reservations & Hold Queue</span>
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Strict FIFO waitlist queueing system, hold fulfillment, and shelf pickup allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>
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

      {/* Privileged Tabs */}
      {isPrivileged && (
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#1B4332] text-white shadow-md'
                : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Circulation Queue Management</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('my');
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my'
                ? 'bg-[#1B4332] text-white shadow-md'
                : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>My Personal Holds</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      {activeTab === 'all' && metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Waiting in Queue</span>
            <p className="text-2xl font-bold text-[#D97706] mt-1">{metrics.totalWaiting || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Ready for Pickup</span>
            <p className="text-2xl font-bold text-[#1B4332] mt-1">{metrics.totalAvailable || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Fulfilled Loans</span>
            <p className="text-2xl font-bold text-[#1F2937] mt-1">{metrics.totalFulfilled || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Cancelled</span>
            <p className="text-2xl font-bold text-[#6B7280] mt-1">{metrics.totalCancelled || 0}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Expired Holds</span>
            <p className="text-2xl font-bold text-red-600 mt-1">{metrics.totalExpired || 0}</p>
          </div>
        </div>
      )}

      {activeTab === 'my' && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Ready for Pickup</span>
            <p className="text-2xl font-bold text-[#1B4332] mt-1">{summary.readyForPickupCount || 0}</p>
            <p className="text-[11px] text-[#6B7280] mt-1">Collect at main circulation desk</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Waiting in Queue</span>
            <p className="text-2xl font-bold text-[#D97706] mt-1">{summary.waitingCount || 0}</p>
            <p className="text-[11px] text-[#6B7280] mt-1">Pending copies returned by borrowers</p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Past History</span>
            <p className="text-2xl font-bold text-[#1F2937] mt-1">{summary.historyCount || 0}</p>
            <p className="text-[11px] text-[#6B7280] mt-1">Fulfilled, expired, or cancelled holds</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar for Admin View */}
      {activeTab === 'all' && (
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-6 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by book title, ISBN, borrower name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting (In Queue)</option>
              <option value="Available">Available (Held for pickup)</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      )}

      {/* Reservation Records List / Table */}
      <div className="mt-6 bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm">
        {loading && reservations.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#D97706]" />
            <p className="text-sm text-[#6B7280]">Loading reservation queue records...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-20 text-center p-6">
            <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-bold text-[#1F2937]">
              No reservation records found
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {activeTab === 'all'
                ? 'No queue records matching the selected criteria.'
                : 'You have not reserved any books yet. Place a hold on books with 0 available copies.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F6] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Book Title</th>
                  {activeTab === 'all' && <th className="py-3.5 px-4">Borrower</th>}
                  <th className="py-3.5 px-4 text-center">Queue Position</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Hold Deadline</th>
                  <th className="py-3.5 px-4">Reserved Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {reservations.map((res) => {
                  const book = res.book;
                  const isWaiting = ['Waiting', 'Pending'].includes(res.status);
                  const isAvailableHold = res.status === 'Available';

                  return (
                    <tr
                      key={res._id}
                      className="hover:bg-[#F9F9F6]/60 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-[#1F2937]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-[#1B4332]/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-[#E5E7EB]">
                            {book?.coverImage ? (
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-4 h-4 text-[#1B4332]" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold line-clamp-1">{book?.title || 'Unknown Title'}</span>
                            <span className="text-[11px] text-[#6B7280] block">by {book?.author || 'Author'}</span>
                            <span className="text-[10px] font-mono text-[#6B7280]">ISBN: {book?.ISBN}</span>
                          </div>
                        </div>
                      </td>

                      {activeTab === 'all' && (
                        <td className="py-4 px-4 text-[#1F2937]">
                          <div>
                            <span className="font-semibold block">{res.user?.name}</span>
                            <span className="text-[11px] text-[#6B7280]">{res.user?.email}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] mt-0.5 inline-block">
                              {res.user?.role}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="py-4 px-4 text-center">
                        {isWaiting ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-[#D97706] font-bold text-xs">
                            #{res.queuePosition}
                          </span>
                        ) : isAvailableHold ? (
                          <span className="text-[#1B4332] font-bold">1st (Ready)</span>
                        ) : (
                          <span className="text-[#6B7280]">-</span>
                        )}
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(res.status)}</td>

                      <td className="py-4 px-4 text-[#1F2937]">
                        {res.holdUntil ? (
                          <div>
                            <span className="font-semibold text-[#1B4332] block">
                              Until {new Date(res.holdUntil).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-[#6B7280]">3-day pickup hold</span>
                          </div>
                        ) : (
                          <span className="text-[#6B7280]">-</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-[#6B7280]">
                        {new Date(res.reservationDate || res.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Admin/Librarian Fulfillment & Notification actions */}
                          {isPrivileged && activeTab === 'all' && isAvailableHold && (
                            <button
                              type="button"
                              disabled={processingId === res._id}
                              onClick={() => handleFulfill(res._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#143527] shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            >
                              Fulfill Hold
                            </button>
                          )}

                          {isPrivileged && activeTab === 'all' && isWaiting && (
                            <button
                              type="button"
                              disabled={processingId === res._id}
                              onClick={() => handleNotify(res._id)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-[#D97706] bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                              title="Mark copy as ready and notify borrower"
                            >
                              <Bell className="w-3.5 h-3.5 inline mr-1" />
                              Notify
                            </button>
                          )}

                          {/* Cancellation for active holds */}
                          {(isWaiting || isAvailableHold) && (
                            <button
                              type="button"
                              disabled={processingId === res._id}
                              onClick={() => handleCancel(res._id, book?.title)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'all' && totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9F6] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9F6] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

