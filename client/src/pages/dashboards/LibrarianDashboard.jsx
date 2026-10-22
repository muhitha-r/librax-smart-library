import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAllBorrowings, fetchBooks } from '../../services/api';
import {
  BookMarked,
  BookOpen,
  Clock,
  ArrowRight,
  PlusCircle,
  Coins,
  Bookmark,
  RotateCcw,
  Loader2,
  FileText,
} from 'lucide-react';

export default function LibrarianDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [borrowRes, booksRes] = await Promise.all([
          fetchAllBorrowings({ limit: 1 }),
          fetchBooks({ limit: 1 }),
        ]);
        if (borrowRes.metrics) setMetrics(borrowRes.metrics);
        if (booksRes.pagination) setCatalogTotal(booksRes.pagination.total);
      } catch (err) {
        console.error('Failed to load librarian dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Welcome Hero */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#143527] to-[#081C15] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#1B4332]/20 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-[#D97706]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2.5 shadow-sm">
              <BookMarked className="w-3.5 h-3.5 text-emerald-600" />
              <span>Circulation & Cataloging Terminal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Librarian Operations & Circulation Terminal
            </h1>
            <p className="text-stone-300 text-xs mt-1 max-w-xl">
              Circulation hub. Manage book acquisitions, issue and return operations for teaching faculty and students, track desk hold reservations, and oversee overdue fine collections.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/reports"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 shadow-sm transition-all text-xs"
              >
                <FileText className="w-4 h-4 text-stone-300" />
                <span>Audit Reports</span>
              </Link>
              <Link
                to="/books"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md transition-all text-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Catalog New Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <span className="text-xs text-stone-300">
              Librarian: <strong>{user?.email}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Book Inventory
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#1B4332]" /> : `${catalogTotal} Titles`}
          </p>
          <Link to="/books" className="text-xs text-[#1B4332] hover:underline mt-1 inline-block font-semibold">
            Open Catalog Management →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Circulation Desk
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" /> : `${metrics?.totalActive || 0} Active Loans`}
          </p>
          <Link to="/borrow" className="text-xs text-[#D97706] hover:underline mt-1 inline-block font-semibold">
            Manage Circulation →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Loans
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-600">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-rose-600" /> : `${metrics?.totalOverdue || 0} Overdue`}
          </p>
          <Link to="/borrow" className="text-xs text-rose-600 hover:underline mt-1 inline-block font-semibold">
            Enforce Returns →
          </Link>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unpaid Fines
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#B45309] flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#0F172A]">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D97706]" /> : `₹${metrics?.fineSummary?.unpaidFines || 0}`}
          </p>
          <Link to="/borrow" className="text-xs text-[#B45309] hover:underline mt-1 inline-block font-semibold">
            Settle or Waive Fines →
          </Link>
        </div>
      </div>

      {/* 3. Operational Modules Grid */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all mb-8">
        <h2 className="text-lg font-bold text-[#0F172A] mb-2 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-[#1B4332]" />
          <span>Librarian Operational Desks</span>
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Execute full catalog CRUD operations, oversee checkout durations, handle holds, and manage student and staff loans.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Module 1: Catalog Management */}
          <Link
            to="/books"
            className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:border-[#1B4332] hover:bg-slate-100/70 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#1B4332] font-semibold text-sm">
                <PlusCircle className="w-5 h-5" />
                <span>Catalog & Books Management</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1B4332] transition-transform" />
            </div>
            <p className="text-xs text-slate-500">
              Add new book arrivals, edit metadata (ISBN, category, copies), update total and available stock quantities, and remove unborrowed titles.
            </p>
          </Link>

          {/* Module 2: Issue & Return Desk */}
          <Link
            to="/borrow"
            className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:border-[#D97706] hover:bg-slate-100/70 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#D97706] font-semibold text-sm">
                <RotateCcw className="w-5 h-5" />
                <span>Issue & Return Circulation Desk</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#D97706] transition-transform" />
            </div>
            <p className="text-xs text-slate-500">
              Process physical book checkouts and returns. Automatically enforces extended 30-day loan periods for Staff vs standard 14 days for Students.
            </p>
          </Link>

          {/* Module 3: Reservation Management */}
          <Link
            to="/reservations"
            className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:border-[#1B4332] hover:bg-slate-100/70 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#1B4332] font-semibold text-sm">
                <Bookmark className="w-5 h-5" />
                <span>Manage Reservations & Holds</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#1B4332] transition-transform" />
            </div>
            <p className="text-xs text-slate-500">
              Verify pending reservations from learners and faculty. Tag reserved copies on hold shelf and send arrival notifications.
            </p>
          </Link>

          {/* Module 4: Fines & Penalties */}
          <Link
            to="/borrow"
            className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:border-[#D97706] hover:bg-slate-100/70 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#D97706] font-semibold text-sm">
                <Coins className="w-5 h-5" />
                <span>Overdue Fines & Penalty Desk</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-[#D97706] transition-transform" />
            </div>
            <p className="text-xs text-slate-500">
              Track overdue return penalties at ₹5/day, apply faculty waivers, and log fine clearance receipts upon book return.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
