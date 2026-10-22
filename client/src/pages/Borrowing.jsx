import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyBorrowings,
  fetchAllBorrowings,
  fetchOverdueBorrowings,
  fetchBorrowSettings,
  updateBorrowSettings,
  fetchMyReservations,
  fetchAllReservations,
  cancelReservation,
  fetchBooks,
  fetchUsers,
} from '../services/api';
import ReturnModal from '../components/ReturnModal';
import PayFineModal from '../components/PayFineModal';
import BorrowModal from '../components/BorrowModal';
import {
  BookOpen,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Search,
  Filter,
  Layers,
  Calendar,
  User,
  Shield,
  Bookmark,
  Settings,
  ArrowRight,
  TrendingUp,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Hash,
  XCircle,
} from 'lucide-react';

export default function Borrowing() {
  const { user } = useAuth();
  const isPrivileged = user?.role === 'Admin' || user?.role === 'Librarian';
  const isAdmin = user?.role === 'Admin';

  // Tab State
  // Privileged tabs: 'desk' | 'all' | 'overdue' | 'settings' | 'reservations'
  // Member tabs: 'active' | 'history' | 'reservations'
  const [activeTab, setActiveTab] = useState(isPrivileged ? 'desk' : 'active');

  // Data States
  const [records, setRecords] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Filters & Search for Privileged Records Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Settings Edit State (for Admin)
  const [editingSettings, setEditingSettings] = useState({
    finePerDay: 5,
    studentBorrowDurationDays: 14,
    staffBorrowDurationDays: 30,
    maxBooksPerStudent: 4,
    maxBooksPerStaff: 8,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Modals State
  const [returningRecord, setReturningRecord] = useState(null);
  const [payingRecord, setPayingRecord] = useState(null);
  const [issuingBook, setIssuingBook] = useState(null);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

  // Fast Issue Book state in Circulation Desk
  const [availableBooks, setAvailableBooks] = useState([]);
  const [selectedBookForIssue, setSelectedBookForIssue] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 1. Load Data based on role and active tab
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isPrivileged) {
        // Privileged (Admin & Librarian) data fetch
        if (activeTab === 'desk' || activeTab === 'all') {
          const params = {
            page: pagination.page,
            limit: pagination.limit,
            sort: sortBy,
          };
          if (searchQuery.trim()) params.search = searchQuery.trim();
          if (statusFilter) params.status = statusFilter;
          if (roleFilter) params.role = roleFilter;

          const res = await fetchAllBorrowings(params);
          setRecords(res.data || []);
          if (res.metrics) setMetrics(res.metrics);
          if (res.pagination) setPagination(res.pagination);
        } else if (activeTab === 'overdue') {
          const res = await fetchOverdueBorrowings({ page: pagination.page, limit: 20 });
          setRecords(res.data || []);
          if (res.metrics) setMetrics(res.metrics);
          if (res.pagination) setPagination(res.pagination);
        } else if (activeTab === 'reservations') {
          const res = await fetchAllReservations();
          setReservations(res.data || []);
        } else if (activeTab === 'settings') {
          const res = await fetchBorrowSettings();
          if (res.data) {
            setSettings(res.data);
            setEditingSettings({
              finePerDay: res.data.finePerDay || 5,
              studentBorrowDurationDays: res.data.studentBorrowDurationDays || 14,
              staffBorrowDurationDays: res.data.staffBorrowDurationDays || 30,
              maxBooksPerStudent: res.data.maxBooksPerStudent || 4,
              maxBooksPerStaff: res.data.maxBooksPerStaff || 8,
            });
          }
        }
      } else {
        // Member (Student & Staff) data fetch
        if (activeTab === 'active') {
          const res = await fetchMyBorrowings({ status: 'active' });
          setRecords(res.data || []);
          if (res.summary) setMetrics(res.summary);
        } else if (activeTab === 'history') {
          const res = await fetchMyBorrowings({ status: 'history' });
          setRecords(res.data || []);
          if (res.summary) setMetrics(res.summary);
        } else if (activeTab === 'reservations') {
          const res = await fetchMyReservations();
          setReservations(res.data || []);
        }
      }
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to load borrowing records.');
    } finally {
      setLoading(false);
    }
  }, [isPrivileged, activeTab, pagination.page, pagination.limit, searchQuery, statusFilter, roleFilter, sortBy]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load books & users for circulation desk quick issue
  useEffect(() => {
    if (isPrivileged && activeTab === 'desk') {
      fetchBooks({ available: 'true', limit: 50 }).then((res) => {
        if (res.data) setAvailableBooks(res.data);
      }).catch(console.error);

      fetchUsers({ limit: 100 }).then((res) => {
        if (res.data) setAllUsers(res.data);
      }).catch(console.error);
    }
  }, [isPrivileged, activeTab]);

  // Save Settings Handler (Admin only)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateBorrowSettings(editingSettings);
      showToast(res.message || 'Borrowing settings updated successfully.');
      setSettings(res.data);
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Cancel Reservation Handler
  const handleCancelReservation = async (resId) => {
    try {
      const res = await cancelReservation(resId);
      showToast(res.message || 'Reservation cancelled.');
      loadData();
    } catch (err) {
      setError(err.customMessage || err.message || 'Failed to cancel reservation.');
    }
  };

  // Success callbacks for modals
  const handleReturnSuccess = (record, msg) => {
    showToast(msg || 'Book successfully returned and inventory restored.');
    loadData();
  };

  const handlePaySuccess = (record, msg) => {
    showToast(msg || 'Fine transaction recorded successfully.');
    loadData();
  };

  const handleIssueSuccess = (record, msg) => {
    showToast(msg || 'Book successfully issued.');
    setSelectedBookForIssue('');
    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 text-xs font-semibold animate-in fade-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#143527] to-[#081C15] rounded-2xl p-6 sm:p-7 text-white shadow-sm mb-8 relative overflow-hidden border border-[#2D6A4F]/50">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            {isPrivileged && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2.5 shadow-sm">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Librax Circulation Desk • Operations Terminal</span>
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isPrivileged ? 'Circulation Desk & Issue/Return Operations' : 'My Borrowings & Reading Records'}
            </h1>
            <p className="text-stone-300 text-xs mt-1 max-w-2xl">
              {isPrivileged
                ? 'Authorized circulation terminal. Process physical book issues, enforce loan checkout limits, calculate overdue penalties, and record receipts.'
                : 'Track active checkouts, return due dates, and circulation history.'}
            </p>
          </div>

          {isPrivileged && (
            <button
              type="button"
              onClick={() => {
                if (availableBooks.length > 0) {
                  setIssuingBook(availableBooks[0]);
                  setIsBorrowModalOpen(true);
                } else {
                  showToast('No books currently in stock for issue.');
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-all text-xs cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue Book (Accession)</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {isPrivileged ? (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Loans
                </span>
                <span className="text-2xl font-bold text-[#0F172A]">
                  {metrics.totalActive || 0}
                </span>
                <span className="text-xs text-[#D97706] block mt-1 font-medium">Currently checked out</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Overdue Items
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {metrics.totalOverdue || 0}
                </span>
                <span className="text-xs text-red-500 block mt-1 font-medium">Requires return attention</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Returned
                </span>
                <span className="text-2xl font-bold text-[#1B4332]">
                  {metrics.totalReturned || 0}
                </span>
                <span className="text-xs text-[#1B4332] block mt-1 font-medium">Completed circulations</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Unpaid Fines
                </span>
                <span className="text-2xl font-bold text-[#D97706]">
                  ₹{metrics.fineSummary?.unpaidFines || 0}
                </span>
                <span className="text-xs text-[#D97706] block mt-1 font-medium">Outstanding receivable</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all col-span-2 lg:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Collected Fines
                </span>
                <span className="text-2xl font-bold text-[#1B4332]">
                  ₹{metrics.fineSummary?.paidFines || 0}
                </span>
                <span className="text-xs text-[#1B4332] block mt-1 font-medium">Total revenue recorded</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Loans
                </span>
                <span className="text-2xl font-bold text-[#D97706]">
                  {metrics.activeLoans || 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Limit: {user?.role === 'Staff' ? '8 books' : '4 books'}
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Overdue
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {metrics.overdueLoans || 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1">Late returns</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Books Returned
                </span>
                <span className="text-2xl font-bold text-[#1B4332]">
                  {metrics.returnedLoans || 0}
                </span>
                <span className="text-xs text-slate-500 block mt-1">Lifetime total</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Accrued Fines
                </span>
                <span className="text-2xl font-bold text-[#D97706]">
                  ₹{metrics.totalUnpaidFines || 0}
                </span>
                <span className="text-xs text-[#D97706] block mt-1">Pending payment</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all col-span-2 lg:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Fines Cleared
                </span>
                <span className="text-2xl font-bold text-[#1B4332]">
                  ₹{metrics.totalPaidFines || 0}
                </span>
                <span className="text-xs text-[#1B4332] block mt-1">Paid / Waived</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-[#E5E7EB] mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {isPrivileged ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('desk');
                  setStatusFilter('Borrowed');
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'desk'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Circulation Desk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setStatusFilter('');
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>All Loans History</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('overdue');
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'overdue'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Overdue & Fines ({metrics?.totalOverdue || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reservations')}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reservations'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Holds & Reservations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Borrowing Rules & Settings</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'active'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>My Active Loans</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Past Borrowing History</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reservations')}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-sm transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'reservations'
                    ? 'border-[#D97706] text-[#D97706]'
                    : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>My Book Reservations</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB CONTENT: Circulation Desk (Privileged only) */}
      {isPrivileged && activeTab === 'desk' && (
        <div className="space-y-6">
          {/* Quick Issue Widget */}
          <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm">
            <h3 className="text-base font-bold text-[#1F2937] mb-2 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#D97706]" />
              <span>Direct Circulation Checkout</span>
            </h3>
            <p className="text-xs text-[#6B7280] mb-4">
              Quickly select an available book title from the library catalog and issue it directly to any registered student or staff member.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedBookForIssue}
                onChange={(e) => setSelectedBookForIssue(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706] cursor-pointer"
              >
                <option value="">-- Choose an Available Book --</option>
                {availableBooks.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} ({b.availableCopies} avail) — {b.author} [ISBN: {b.ISBN}]
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedBookForIssue}
                onClick={() => {
                  const b = availableBooks.find((book) => book._id === selectedBookForIssue);
                  if (b) {
                    setIssuingBook(b);
                    setIsBorrowModalOpen(true);
                  }
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Checkout Window</span>
              </button>
            </div>
          </div>

          {/* Active Loans Quick Table */}
          <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">
                  Currently Checked Out Items
                </h3>
                <span className="text-xs text-[#6B7280]">
                  Search active circulation loans and process immediate book returns.
                </span>
              </div>

              {/* Search in active loans */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
                <input
                  type="text"
                  placeholder="Search book or borrower..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center items-center text-[#D97706]">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : records.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280] text-sm">
                No active loans currently checked out matching the filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9F9F6] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-4">Book Title & ISBN</th>
                      <th className="p-4">Borrower</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Status & Fines</th>
                      <th className="p-4 text-right">Circulation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {records.map((r) => {
                      const dueDate = new Date(r.dueDate);
                      const isOverdue = new Date() > dueDate;
                      return (
                        <tr key={r._id} className="hover:bg-[#F9F9F6]/60 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-[#1F2937] text-sm">
                              {r.book?.title || 'Unknown Title'}
                            </div>
                            <div className="text-[#6B7280] font-mono text-[11px] mt-0.5">
                              ISBN: {r.book?.ISBN} • {r.book?.category}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[#1F2937]">
                              {r.user?.name}
                            </div>
                            <div className="text-[#6B7280] text-[11px]">
                              {r.user?.email} • <span className="font-semibold text-[#1B4332]">{r.user?.role}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-[#1F2937]">
                              {dueDate.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <span className="text-[11px] text-[#6B7280]">
                              Issued: {new Date(r.borrowDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isOverdue || r.status === 'Overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-emerald-100 text-[#1B4332]'
                                }`}
                              >
                                {isOverdue || r.status === 'Overdue' ? 'Overdue' : 'Active'}
                              </span>
                              {(r.fineAmount > 0 || isOverdue) && (
                                <span className="text-red-600 font-semibold text-xs">
                                  Fine: ₹{r.fineAmount || 'Calculated'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => setReturningRecord(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#D97706] bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Process Return</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: All Loans History (Privileged) */}
      {isPrivileged && activeTab === 'all' && (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search by title, author, user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 text-xs rounded-xl bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              >
                <option value="">All Statuses</option>
                <option value="Borrowed">Active (Borrowed)</option>
                <option value="Overdue">Overdue</option>
                <option value="Returned">Returned</option>
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 text-xs rounded-xl bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              >
                <option value="">All Roles</option>
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
                <option value="Librarian">Librarian</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-12 flex justify-center items-center text-[#D97706]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] text-sm">
              No borrowing records found matching your search and filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F6] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-4">Book</th>
                    <th className="p-4">Borrower</th>
                    <th className="p-4">Borrow Date</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Fines & Payment</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {records.map((r) => {
                    const isReturned = r.status === 'Returned';
                    return (
                      <tr key={r._id} className="hover:bg-[#F9F9F6]/60 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-[#1F2937] text-sm">
                            {r.book?.title}
                          </div>
                          <div className="text-[#6B7280] font-mono text-[11px]">
                            ISBN: {r.book?.ISBN}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-[#1F2937]">{r.user?.name}</div>
                          <div className="text-[#6B7280] text-[11px]">
                            {r.user?.email} • <span className="font-semibold text-[#1B4332]">{r.user?.role}</span>
                          </div>
                        </td>
                        <td className="p-4 text-[#1F2937]">
                          {new Date(r.borrowDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={new Date() > new Date(r.dueDate) && !isReturned ? 'text-red-600 font-semibold' : 'text-[#1F2937]'}>
                            {new Date(r.dueDate).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              r.status === 'Returned'
                                ? 'bg-emerald-100 text-[#1B4332]'
                                : r.status === 'Overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-[#B45309]'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {r.fineAmount > 0 ? (
                            <div>
                              <div className="font-semibold text-[#1F2937]">
                                ₹{r.fineAmount}
                              </div>
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wider ${
                                  r.finePaymentStatus === 'Paid'
                                    ? 'text-[#1B4332]'
                                    : r.finePaymentStatus === 'Waived'
                                    ? 'text-[#6B7280]'
                                    : 'text-red-600'
                                }`}
                              >
                                {r.finePaymentStatus}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#6B7280]">₹0</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isReturned && (
                              <button
                                type="button"
                                onClick={() => setReturningRecord(r)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#D97706] bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                              >
                                Return
                              </button>
                            )}
                            {r.fineAmount > 0 && r.finePaymentStatus === 'Unpaid' && (
                              <button
                                type="button"
                                onClick={() => setPayingRecord(r)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-colors cursor-pointer"
                              >
                                Settle Fine
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
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9F9F6]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] disabled:opacity-40 hover:bg-[#F9F9F6]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Overdue & Fines (Privileged) */}
      {isPrivileged && activeTab === 'overdue' && (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                <span>Overdue Books Enforcement</span>
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Items that have crossed their return date. Fines accrue automatically at ₹5/day until returned.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center items-center text-[#D97706]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span>Great news! There are currently no overdue borrowing records in the library.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F6] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-4">Book Title</th>
                    <th className="p-4">Borrower Contact</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Accrued Fine</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-red-50/20 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-[#1F2937] text-sm">
                          {r.book?.title}
                        </div>
                        <div className="text-[#6B7280] font-mono text-[11px]">
                          ISBN: {r.book?.ISBN}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-[#1F2937]">{r.user?.name}</div>
                        <div className="text-[#6B7280] text-[11px]">{r.user?.email}</div>
                      </td>
                      <td className="p-4 text-red-600 font-semibold">
                        {new Date(r.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-red-600">
                          ₹{r.fineAmount}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.finePaymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-[#1B4332]'
                              : r.finePaymentStatus === 'Waived'
                              ? 'bg-amber-100 text-[#B45309]'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {r.finePaymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReturningRecord(r)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#D97706] bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                          >
                            Return Book
                          </button>
                          {r.fineAmount > 0 && r.finePaymentStatus === 'Unpaid' && (
                            <button
                              type="button"
                              onClick={() => setPayingRecord(r)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-all cursor-pointer"
                            >
                              Settle Fine
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Borrowing Rules & Settings (Admin/Librarian) */}
      {isPrivileged && activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D97706]" />
                <span>Borrowing Policies & Parameters</span>
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Configure loan duration limits, student/staff quotas, and daily fine rates.
              </p>
            </div>
            {!isAdmin && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-[#B45309] font-semibold border border-amber-200">
                Librarian View Only
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                Fine Rate Per Day (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                value={editingSettings.finePerDay}
                disabled={!isAdmin}
                onChange={(e) =>
                  setEditingSettings({ ...editingSettings, finePerDay: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Student Loan Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingSettings.studentBorrowDurationDays}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      studentBorrowDurationDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Staff Loan Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingSettings.staffBorrowDurationDays}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      staffBorrowDurationDays: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Max Books Per Student
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingSettings.maxBooksPerStudent}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      maxBooksPerStudent: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                  Max Books Per Staff
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingSettings.maxBooksPerStaff}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setEditingSettings({
                      ...editingSettings,
                      maxBooksPerStaff: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md shadow-amber-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Policies...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Update Borrowing Settings</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB CONTENT: Reservations (Privileged or Member) */}
      {activeTab === 'reservations' && (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#D97706]" />
              <span>{isPrivileged ? 'System-wide Book Reservations' : 'My Active Book Reservations'}</span>
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Reservations are automatically fulfilled in FIFO queue order as returned copies arrive in catalog.
            </p>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center items-center text-[#D97706]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] text-sm">
              No book holds or reservations found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F6] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-4">Book Title</th>
                    {isPrivileged && <th className="p-4">Member Name</th>}
                    <th className="p-4">Reserved Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {reservations.map((res) => (
                    <tr key={res._id} className="hover:bg-[#F9F9F6]/60 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-[#1F2937] text-sm">
                          {res.book?.title}
                        </div>
                        <div className="text-[#6B7280] font-mono text-[11px]">
                          ISBN: {res.book?.ISBN}
                        </div>
                      </td>
                      {isPrivileged && (
                        <td className="p-4">
                          <div className="font-medium text-[#1F2937]">{res.user?.name}</div>
                          <div className="text-[#6B7280] text-[11px]">{res.user?.email}</div>
                        </td>
                      )}
                      <td className="p-4 text-[#1F2937]">
                        {new Date(res.reservationDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            res.status === 'Fulfilled'
                              ? 'bg-emerald-100 text-[#1B4332]'
                              : res.status === 'Cancelled'
                              ? 'bg-gray-100 text-[#6B7280]'
                              : 'bg-amber-100 text-[#B45309]'
                          }`}
                        >
                          {res.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {res.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleCancelReservation(res._id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                          >
                            Cancel Hold
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Member Active Loans (Student & Staff) */}
      {!isPrivileged && activeTab === 'active' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-[#D97706]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E5E7EB] shadow-sm max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-[#D97706] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1F2937] mb-1">
                No Active Books Borrowed
              </h3>
              <p className="text-xs text-[#6B7280] mb-4">
                You do not have any books currently checked out. Browse the library catalog to find and borrow books.
              </p>
              <a
                href="/books"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#D97706] hover:bg-[#B45309] transition-all shadow-md shadow-amber-600/20"
              >
                <span>Browse Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records.map((r) => {
                const dueDate = new Date(r.dueDate);
                const isOverdue = new Date() > dueDate;
                const msDiff = dueDate.getTime() - new Date().getTime();
                const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={r._id}
                    className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {r.book?.coverImage ? (
                            <img
                              src={r.book.coverImage}
                              alt={r.book.title}
                              className="w-14 h-18 object-cover rounded-xl border border-[#E5E7EB] flex-shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-18 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <span className="text-[11px] font-semibold text-[#D97706] uppercase tracking-wider">
                              {r.book?.category}
                            </span>
                            <h4 className="text-sm font-bold text-[#1F2937] line-clamp-1">
                              {r.book?.title}
                            </h4>
                            <p className="text-xs text-[#6B7280] truncate">by {r.book?.author}</p>
                            <span className="text-[11px] font-mono text-[#6B7280]">
                              ISBN: {r.book?.ISBN}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isOverdue
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-[#1B4332]'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-[#F9F9F6] border border-[#E5E7EB]/60 rounded-2xl mb-4 text-xs">
                        <div>
                          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                            Borrowed On
                          </span>
                          <span className="font-semibold text-[#1F2937]">
                            {new Date(r.borrowDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block font-semibold">
                            Due Date
                          </span>
                          <span
                            className={`font-semibold ${
                              isOverdue ? 'text-red-600' : 'text-[#1F2937]'
                            }`}
                          >
                            {dueDate.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Overdue alert / Remaining Days badge */}
                      {isOverdue ? (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between mb-4">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                            <span>Overdue Item</span>
                          </span>
                          <span className="font-bold">Fine Accrued: ₹{r.fineAmount}</span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#1B4332]/5 border border-[#1B4332]/10 text-xs text-[#1B4332] flex items-center justify-between mb-4">
                          <span>Return Window</span>
                          <span className="font-semibold text-[#D97706]">
                            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Due today'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setReturningRecord(r)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#D97706] bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return Book</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Member Borrowing History (Student & Staff) */}
      {!isPrivileged && activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB]">
            <h3 className="text-base font-bold text-[#1F2937]">
              Completed Borrowing History
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Archive of all previously returned books and assessed fines.
            </p>
          </div>

          {loading ? (
            <div className="p-12 flex justify-center items-center text-[#D97706]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-[#6B7280] text-sm">
              No returned records found in your borrowing history yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F6] text-[#6B7280] uppercase tracking-wider font-semibold border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-4">Book Title</th>
                    <th className="p-4">Borrowed Date</th>
                    <th className="p-4">Returned Date</th>
                    <th className="p-4">Fine Assessed</th>
                    <th className="p-4 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-[#F9F9F6]/60 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-[#1F2937] text-sm">
                          {r.book?.title}
                        </div>
                        <div className="text-[#6B7280] font-mono text-[11px]">
                          ISBN: {r.book?.ISBN}
                        </div>
                      </td>
                      <td className="p-4 text-[#1F2937]">
                        {new Date(r.borrowDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-[#1F2937]">
                        {r.returnDate ? new Date(r.returnDate).toLocaleDateString() : 'Returned'}
                      </td>
                      <td className="p-4">
                        {r.fineAmount > 0 ? (
                          <span className="font-semibold text-red-600">₹{r.fineAmount}</span>
                        ) : (
                          <span className="text-[#6B7280]">None (₹0)</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.finePaymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-[#1B4332]'
                              : r.finePaymentStatus === 'Waived'
                              ? 'bg-amber-100 text-[#B45309]'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {r.finePaymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Return Modal */}
      <ReturnModal
        record={returningRecord}
        isOpen={!!returningRecord}
        onClose={() => setReturningRecord(null)}
        onSuccess={handleReturnSuccess}
      />

      {/* Pay Fine Modal */}
      <PayFineModal
        record={payingRecord}
        isOpen={!!payingRecord}
        onClose={() => setPayingRecord(null)}
        onSuccess={handlePaySuccess}
      />

      {/* Issue / Borrow Modal */}
      <BorrowModal
        book={issuingBook}
        isOpen={isBorrowModalOpen}
        onClose={() => {
          setIsBorrowModalOpen(false);
          setIssuingBook(null);
        }}
        onSuccess={handleIssueSuccess}
      />
    </div>
  );
}

