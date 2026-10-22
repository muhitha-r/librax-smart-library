import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Download,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  BookOpen,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Coins,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchReports, downloadReportCSV } from '../services/api';

export default function Reports() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('borrowing');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Data state
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadReportData = async (currentPage = page) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const params = {
        type: reportType,
        page: currentPage,
        limit: 15,
      };

      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await fetchReports(params);
      if (res?.data) {
        setRecords(res.data);
        setSummary(res.summary);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalRecords(res.pagination?.total || 0);
        setPage(currentPage);
      }
    } catch (err) {
      setErrorMsg(err.customMessage || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData(1);
  }, [reportType, statusFilter]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Invalid date range: Start Date cannot be after End Date.');
      return;
    }
    loadReportData(1);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter('All');
    setSearchTerm('');
    setErrorMsg(null);
    setPage(1);
    setTimeout(() => {
      loadReportData(1);
    }, 0);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setErrorMsg(null);
      const params = {
        type: reportType,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter && statusFilter !== 'All') params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      await downloadReportCSV(params);
      setSuccessMsg(`CSV report for ${reportType.toUpperCase()} successfully downloaded.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.customMessage || 'Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const setDatePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const setThisMonthPreset = () => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Returned':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Returned
          </span>
        );
      case 'Overdue':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      case 'Borrowed':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
            Active Loan
          </span>
        );
    }
  };

  const getFineBadge = (status, amount) => {
    if (!amount || amount <= 0) {
      return <span className="text-[#6B7280] text-xs">No Fine</span>;
    }
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> ₹{amount} (Paid)
          </span>
        );
      case 'Waived':
        return (
          <span className="text-xs font-semibold text-[#1B4332]">
            ₹{amount} (Waived)
          </span>
        );
      case 'Unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
            <AlertCircle className="w-3.5 h-3.5" /> ₹{amount} (Unpaid)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/75 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2 shadow-sm">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Librax Audit Console • Circulation Audit Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
            Library Reports & Circulation Audit Logs
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Query institutional circulation history, return compliance, overdue violations, and fine collections with date range filtering and CSV export.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadReportData(page)}
            className="p-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6] transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D97706]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting || loading || totalRecords === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md shadow-amber-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating CSV...' : 'Export to CSV'}</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Report Type Pills */}
      <div className="flex flex-wrap items-center gap-2.5 mt-6">
        {[
          { id: 'borrowing', label: 'Borrowing Activity', icon: BookOpen },
          { id: 'returns', label: 'Book Returns', icon: RotateCcw },
          { id: 'overdue', label: 'Overdue Loans', icon: Clock },
          { id: 'fines', label: 'Fines & Penalties', icon: Coins },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = reportType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setReportType(t.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1B4332] text-white shadow-md'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9F9F6]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Form Card */}
      <div className="mt-6 bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-sm">
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                <span>End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Filter Status</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              >
                <option value="All">All Statuses</option>
                {reportType !== 'returns' && <option value="Borrowed">Active Loans (Borrowed)</option>}
                <option value="Returned">Returned</option>
                <option value="Overdue">Overdue</option>
                {reportType === 'fines' && (
                  <>
                    <option value="Unpaid">Unpaid Fines</option>
                    <option value="Paid">Paid Fines</option>
                    <option value="Waived">Waived Fines</option>
                  </>
                )}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Search Keywords</span>
              </label>
              <input
                type="text"
                placeholder="Title, ISBN, borrower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#F9F9F6] border border-[#E5E7EB] text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
              />
            </div>
          </div>

          {/* Quick Date Presets & Submit Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5E7EB]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#6B7280]">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setDatePreset(7)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F9F9F6] border border-[#E5E7EB] hover:bg-[#E5E7EB] text-[#1F2937] transition-colors"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setDatePreset(30)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F9F9F6] border border-[#E5E7EB] hover:bg-[#E5E7EB] text-[#1F2937] transition-colors"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={setThisMonthPreset}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F9F9F6] border border-[#E5E7EB] hover:bg-[#E5E7EB] text-[#1F2937] transition-colors"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#D97706] hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-all cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Total Filtered Records</span>
            <p className="text-2xl font-bold text-[#1F2937] mt-1">
              {summary.totalRecords || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Total Fines Accrued</span>
            <p className="text-2xl font-bold text-[#D97706] mt-1">
              ₹{summary.totalFines || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Collected Fines</span>
            <p className="text-2xl font-bold text-[#1B4332] mt-1">
              ₹{summary.paidFines || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-sm">
            <span className="text-[11px] font-semibold uppercase text-[#6B7280]">Outstanding Fines</span>
            <p className="text-2xl font-bold text-red-600 mt-1">
              ₹{summary.unpaidFines || 0}
            </p>
          </div>
        </div>
      )}

      {/* Report Records Table */}
      <div className="mt-6 bg-white border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-sm">
        {loading && records.length === 0 ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#D97706]" />
            <p className="text-sm text-[#6B7280]">Querying database for report records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center p-6">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-base font-bold text-[#1F2937]">
              No matching records found
            </h3>
            <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
              There are no transactions matching the selected report type and date parameters. Try adjusting your date range.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F6] border-b border-[#E5E7EB] text-[#6B7280] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Book Details</th>
                  <th className="py-3.5 px-4">Borrower</th>
                  <th className="py-3.5 px-4">Borrow Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Fine Assessment</th>
                  <th className="py-3.5 px-4">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {records.map((r) => {
                  const book = r.book;
                  const borrower = r.user;

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-[#F9F9F6]/60 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-[#1F2937] block line-clamp-1">
                            {book?.title || 'Unknown Title'}
                          </span>
                          <span className="text-[11px] text-[#6B7280]">
                            {book?.author} • <span className="text-[#D97706] font-semibold">{book?.category}</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#6B7280] block">
                            ISBN: {book?.ISBN || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-semibold text-[#1F2937] block">
                            {borrower?.name || 'Unknown'}
                          </span>
                          <span className="text-[11px] text-[#6B7280] block">{borrower?.email}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1B4332]/10 text-[#1B4332] inline-block mt-0.5">
                            {borrower?.role}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#1F2937]">
                        {r.borrowDate ? new Date(r.borrowDate).toLocaleDateString() : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-[#1F2937] font-medium">
                        {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-[#1F2937]">
                        {r.returnDate ? (
                          <span className="text-[#1B4332] font-semibold">
                            {new Date(r.returnDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-[#6B7280] italic">Not Returned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(r.status)}</td>

                      <td className="py-3.5 px-4">
                        {getFineBadge(r.finePaymentStatus, r.fineAmount)}
                      </td>

                      <td className="py-3.5 px-4 text-[#6B7280]">
                        {r.returnedBy ? (
                          <span>Return: {r.returnedBy.name}</span>
                        ) : r.issuedBy ? (
                          <span>Issued: {r.issuedBy.name}</span>
                        ) : (
                          <span>System</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
            <span>
              Showing Page {page} of {totalPages} ({totalRecords} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => loadReportData(page - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9F6] disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => loadReportData(page + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#F9F9F6] disabled:opacity-40"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

