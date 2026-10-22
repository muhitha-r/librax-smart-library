import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUsers,
  fetchAdminAnalytics,
  createUser,
  updateUserRole,
  deleteUser,
} from '../../services/api';
import {
  Shield,
  Users,
  BookOpen,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserPlus,
  BookMarked,
  X,
  RotateCcw,
  Bookmark,
  TrendingUp,
  FileText,
  Clock,
  Coins,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Custom Recharts Tooltip
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#081C15] border border-[#1B4332] p-3 rounded-xl shadow-xl text-xs text-white">
        <p className="font-bold text-[#D97706] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="flex items-center gap-1.5 py-0.5" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  // Tab State: 'analytics' (default) or 'governance'
  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [actionNotice, setActionNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Modal State for Provisioning New User
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Fetch Analytics Data
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const res = await fetchAdminAnalytics();
      if (res?.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      setAnalyticsError(err.customMessage || 'Failed to load system analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Fetch Users List
  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (selectedRoleFilter) params.role = selectedRoleFilter;
      if (userSearchTerm.trim()) params.search = userSearchTerm.trim();
      const res = await fetchUsers(params);
      if (res?.data) {
        setUsersList(res.data);
      }
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetchAdminAnalytics()
      .then((res) => {
        if (!ignore && res?.data) {
          setAnalytics(res.data);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setAnalyticsError(err.customMessage || 'Failed to load system analytics.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setAnalyticsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'governance') return;
    let ignore = false;
    const params = {};
    if (selectedRoleFilter) params.role = selectedRoleFilter;
    if (userSearchTerm.trim()) params.search = userSearchTerm.trim();

    fetchUsers(params)
      .then((res) => {
        if (!ignore && res?.data) {
          setUsersList(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load users:', err);
      })
      .finally(() => {
        if (!ignore) {
          setUsersLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeTab, selectedRoleFilter, userSearchTerm]);

  const showNotice = (msg) => {
    setActionNotice(msg);
    setActionError(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const showError = (msg) => {
    setActionError(msg);
    setActionNotice(null);
    setTimeout(() => setActionError(null), 4000);
  };

  // Handle Role Change
  const handleRoleChange = async (targetUserId, newRole, userName) => {
    try {
      await updateUserRole(targetUserId, newRole);
      showNotice(`Updated ${userName}'s role to ${newRole}.`);
      loadUsers();
      loadAnalytics();
    } catch (err) {
      showError(err.customMessage || err.message || 'Failed to update user role.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUserId, userName) => {
    if (!window.confirm(`Are you sure you want to remove user '${userName}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteUser(targetUserId);
      showNotice(`User '${userName}' was removed.`);
      loadUsers();
      loadAnalytics();
    } catch (err) {
      showError(err.customMessage || err.message || 'Failed to delete user.');
    }
  };

  // Handle Create User
  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim() || !newUserForm.password) {
      showError('Please fill in all required fields.');
      return;
    }
    if (newUserForm.password.length < 6) {
      showError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setCreateSubmitting(true);
      await createUser(newUserForm);
      showNotice(`Successfully provisioned account for ${newUserForm.name} (${newUserForm.role}).`);
      setIsCreateModalOpen(false);
      setNewUserForm({ name: '', email: '', password: '', role: 'Staff' });
      loadUsers();
      loadAnalytics();
    } catch (err) {
      showError(err.customMessage || err.message || 'Failed to create user account.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const summary = analytics?.summary;
  const charts = analytics?.charts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-r from-[#1B4332] via-[#143527] to-[#081C15] border border-[#1B4332]/40 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#081C15]/20 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-[#D97706]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium px-2.5 py-0.5 rounded-full text-xs mb-2.5 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Administrative Governance Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Executive Analytics & Library Operations
            </h1>
            <p className="text-stone-300 text-xs mt-1 max-w-xl">
              Central institutional intelligence. Monitor live circulation metrics, catalog utilization, fee collection audits, and institutional user identity privileges.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/reports"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-white bg-[#D97706] hover:bg-[#B45309] shadow-sm transition-all text-xs cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Audit Reports & CSV</span>
              </Link>
              <Link
                to="/borrow"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 shadow-sm transition-all text-xs"
              >
                <RotateCcw className="w-4 h-4 text-emerald-300" />
                <span>Circulation Desk</span>
              </Link>
              <Link
                to="/reservations"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 shadow-sm transition-all text-xs"
              >
                <Bookmark className="w-4 h-4 text-amber-300" />
                <span>Queue Holds</span>
              </Link>
            </div>
            <span className="text-xs text-stone-300">
              Admin Session: <strong className="text-white">{user?.email}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top View Switcher Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#1B4332] text-white shadow-md'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Real-time Analytics & Charts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('governance')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'governance'
              ? 'bg-[#1B4332] text-white shadow-md'
              : 'bg-white border border-slate-200/80 text-slate-600 hover:text-[#0F172A] hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Governance & Role Provisioning</span>
        </button>

        <button
          type="button"
          onClick={loadAnalytics}
          className="ml-auto p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          title="Refresh Analytics"
        >
          <RefreshCw className={`w-4 h-4 ${analyticsLoading ? 'animate-spin text-[#D97706]' : ''}`} />
        </button>
      </div>

      {/* Notifications / Alerts */}
      {analyticsError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{analyticsError}</span>
          </div>
          <button onClick={() => setAnalyticsError(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionNotice && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. TAB 1: Real-time Analytics & Charts */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Real Statistics Grid (7 Core Metrics) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* 1. Total Books */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Books
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#0F172A]">
                  {analyticsLoading ? '...' : summary?.totalBooks || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {summary?.totalCopies || 0} Total Copies Cataloged
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link to="/books" className="text-[#D97706] font-semibold hover:underline flex items-center gap-1">
                  Manage Catalog <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 2. Available Books */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Available Copies
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-emerald-800">
                  {analyticsLoading ? '...' : summary?.availableBooks || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Ready for instant desk checkout
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Stock Health: <strong className="text-slate-700">{summary?.totalCopies ? Math.round((summary.availableBooks / summary.totalCopies) * 100) : 100}%</strong></span>
              </div>
            </div>

            {/* 3. Total Users */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Registered Users
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#0F172A]">
                  {analyticsLoading ? '...' : summary?.totalUsers || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {summary?.usersByRole
                    ? `${summary.usersByRole.Student} Students • ${summary.usersByRole.Staff} Staff`
                    : 'All 4 System Roles'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('governance')}
                  className="text-[#D97706] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Manage Roles <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 4. Borrowed Books */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Borrowed Books
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#D97706]">
                  {analyticsLoading ? '...' : summary?.borrowedBooks || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {summary?.activeLoans || 0} Active Loans • {summary?.overdueBooks || 0} Overdue
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link to="/borrow" className="text-[#D97706] font-semibold hover:underline flex items-center gap-1">
                  Circulation Desk <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 5. Overdue Books */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Overdue Books
                </span>
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-red-600">
                  {analyticsLoading ? '...' : summary?.overdueBooks || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Accruing ₹5/day penalty
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link to="/reports" className="text-red-600 font-semibold hover:underline flex items-center gap-1">
                  Overdue Report <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 6. Active Reservations */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Reservations
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                  <Bookmark className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-[#D97706]">
                  {analyticsLoading ? '...' : summary?.activeReservations || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Waiting in queue or ready on hold shelf
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link to="/reservations" className="text-[#D97706] font-semibold hover:underline flex items-center gap-1">
                  Queue Holds Desk <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* 7. Pending Fines */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Fines & Revenue Summary
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#D97706]/10 text-[#D97706] flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Pending Unpaid Fines</span>
                  <p className="text-2xl font-extrabold text-red-600 mt-0.5">
                    ₹{analyticsLoading ? '...' : summary?.pendingFines || 0}
                  </p>
                  <span className="text-[10px] text-slate-500">{summary?.unpaidFinesCount || 0} citations</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Collected Revenue</span>
                  <p className="text-2xl font-extrabold text-[#1B4332] mt-0.5">
                    ₹{analyticsLoading ? '...' : summary?.paidFines || 0}
                  </p>
                  <span className="text-[10px] text-slate-500">₹{summary?.totalFines || 0} total assessed</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <Link to="/reports" className="text-[#D97706] font-semibold hover:underline flex items-center gap-1">
                  View Fines Audit Report <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Monthly Trends & Loan Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Monthly Borrowing & Return Trends (2 Cols) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#D97706]" />
                    <span>Monthly Borrowing & Returns Trends</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Circulation velocity over the last 6 calendar months
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20">
                  Live Atlas Data
                </span>
              </div>

              <div className="h-72 w-full mt-2">
                {charts?.monthlyTrends && charts.monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="borrowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D97706" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="returnGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B4332" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area
                        type="monotone"
                        dataKey="borrows"
                        name="Checkouts (Borrows)"
                        stroke="#D97706"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#borrowGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="returns"
                        name="Returns"
                        stroke="#1B4332"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#returnGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No borrowing activity recorded in the current timeframe.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Returned vs Overdue vs Active Loans (1 Col) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-[#1B4332]" />
                  <span>Loan Status Ratio</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of returned, active, and overdue loans
                </p>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                {charts?.loanStatusBreakdown && charts.loanStatusBreakdown.some((i) => i.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.loanStatusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.loanStatusBreakdown.map((entry, index) => {
                          const sliceColors = {
                            Returned: '#1B4332',
                            Active: '#D97706',
                            Overdue: '#DC2626',
                          };
                          const fillCol = sliceColors[entry.name] || entry.color || '#1B4332';
                          return <Cell key={`cell-${index}`} fill={fillCol} />;
                        })}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-xs text-slate-500">
                    <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <span>No active loan distribution data yet</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
                Total Borrow Records: <strong className="text-slate-800">{(summary?.returnedBooks || 0) + (summary?.borrowedBooks || 0)}</strong>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Most Borrowed Books & Popular Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Most Borrowed Books */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#D97706]" />
                    <span>Top Borrowed Titles</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Most requested catalog entries by circulation frequency
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {charts?.topBorrowedBooks && charts.topBorrowedBooks.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={charts.topBorrowedBooks}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} horizontal={false} />
                      <XAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="title"
                        stroke="#64748B"
                        fontSize={10}
                        width={120}
                        tickFormatter={(val) => (val.length > 18 ? `${val.substring(0, 18)}...` : val)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="borrows" name="Total Borrows" fill="#D97706" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No borrowing records available to rank titles.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 4: Popular Categories */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-[#1B4332]" />
                    <span>Catalog Categories Distribution</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Titles and volume share grouped by department classification
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                {charts?.popularCategories && charts.popularCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.popularCategories} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.8} vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                      <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="count" name="Unique Titles" fill="#1B4332" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="copies" name="Total Copies" fill="#D97706" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    No catalog categories defined.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: User Governance & Role Provisioning Desk */}
      {activeTab === 'governance' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all p-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1B4332]" />
                <span>User Governance & Role Provisioning</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provision Staff and Librarian personnel, manage role privileges, and inspect member accounts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#D97706] hover:bg-[#B45309] transition-all shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision New User</span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {['', 'Admin', 'Librarian', 'Staff', 'Student'].map((r) => (
                <button
                  key={r || 'all'}
                  type="button"
                  onClick={() => setSelectedRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedRoleFilter === r
                      ? 'bg-[#1B4332] text-white shadow-sm'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                  }`}
                >
                  {r || 'All Roles'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706]"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Change Role</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      Loading users list...
                    </td>
                  </tr>
                ) : usersList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No users matched your query.
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => {
                    const isSelf = u._id === user?.id || u.email === user?.email;
                    return (
                      <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#0F172A] flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center font-bold text-xs uppercase">
                            {u.name.charAt(0)}
                          </div>
                          <span>{u.name}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-[#D97706]/15 text-[#B45309] font-bold px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              u.role === 'Admin'
                                ? 'bg-[#D97706]/15 text-[#B45309] border-[#D97706]/30'
                                : u.role === 'Librarian'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : u.role === 'Staff'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            disabled={isSelf}
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value, u.name)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#D97706] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Librarian">Librarian</option>
                            <option value="Staff">Staff</option>
                            <option value="Student">Student</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title={isSelf ? 'Cannot delete own account' : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Modal: Provision New User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200/80 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#1B4332]/10 text-[#1B4332]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Provision User Account</h3>
                  <p className="text-xs text-slate-500">Create an authorized institutional identity</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide mb-1 text-[11px]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D97706] focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide mb-1 text-[11px]">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="user@librax.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D97706] focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide mb-1 text-[11px]">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#D97706] focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] uppercase tracking-wide mb-1 text-[11px]">
                  Designated Role
                </label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#D97706] focus:border-[#D97706]"
                >
                  <option value="Staff">Staff (Departmental Faculty)</option>
                  <option value="Librarian">Librarian (Circulation Desk)</option>
                  <option value="Admin">Administrator (Full Access)</option>
                  <option value="Student">Student (General Learner)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-[#D97706] hover:bg-[#B45309] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {createSubmitting ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
