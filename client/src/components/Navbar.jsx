import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  LogOut,
  Shield,
  BookMarked,
  GraduationCap,
  Briefcase,
  LayoutDashboard,
  RotateCcw,
  Bookmark,
  Heart,
  FileText,
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Hide navbar on login, register, and unauthenticated landing page
  // to ensure a true full-screen bookshelf background and clean centered card interface
  const isAuthLanding =
    (location.pathname === '/' ||
      location.pathname === '/login' ||
      location.pathname === '/register') &&
    !isAuthenticated;

  if (isAuthLanding || location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D97706]/20 text-[#FEF3C7] border border-[#D97706]/40">
            <Shield className="w-3 h-3 text-[#D97706]" /> Admin
          </span>
        );
      case 'Librarian':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-[#D8F3DC] border border-emerald-400/30">
            <BookMarked className="w-3 h-3 text-emerald-300" /> Librarian
          </span>
        );
      case 'Staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-100 border border-sky-400/30">
            <Briefcase className="w-3 h-3 text-sky-300" /> Staff
          </span>
        );
      case 'Student':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D97706]/20 text-[#FEF3C7] border border-[#D97706]/40">
            <GraduationCap className="w-3 h-3 text-[#D97706]" /> Student
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#143527] bg-[#1B4332] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Minimalist Product Logo & Brand */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-[#081C15] border border-[#2D6A4F] flex items-center justify-center text-[#D97706] shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Librax
              </span>
            </div>
            <p className="text-[11px] text-[#A7D4B6] font-medium leading-none">
              Smart Library Management System
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/books"
            className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive('/books')
                ? 'bg-[#081C15] text-[#D97706] border border-[#2D6A4F]'
                : 'text-white/80 hover:text-white hover:bg-[#143527]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#D97706]" />
            <span>Browse Catalog</span>
          </Link>

          {isAuthenticated && user ? (
            <>
              {/* Loans / Circulation */}
              <Link
                to="/borrow"
                className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/borrow')
                    ? 'bg-[#081C15] text-[#D97706] border border-[#2D6A4F]'
                    : 'text-white/80 hover:text-white hover:bg-[#143527]'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-emerald-300" />
                <span className="hidden md:inline">
                  {user.role === 'Admin' || user.role === 'Librarian' ? 'Circulation' : 'Loans'}
                </span>
              </Link>

              {/* Reservations */}
              <Link
                to="/reservations"
                className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/reservations')
                    ? 'bg-[#081C15] text-[#D97706] border border-[#2D6A4F]'
                    : 'text-white/80 hover:text-white hover:bg-[#143527]'
                }`}
              >
                <Bookmark className="w-4 h-4 text-[#D97706]" />
                <span className="hidden md:inline">Reservations</span>
              </Link>

              {/* Wishlist for Student */}
              {user.role === 'Student' && (
                <Link
                  to="/student/wishlist"
                  className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/student/wishlist')
                      ? 'bg-[#081C15] text-[#D97706] border border-[#2D6A4F]'
                      : 'text-white/80 hover:text-white hover:bg-[#143527]'
                  }`}
                >
                  <Heart className="w-4 h-4 text-rose-300 fill-rose-300/30" />
                  <span className="hidden sm:inline">Wishlist</span>
                </Link>
              )}

              {/* Reports for Admin/Librarian */}
              {(user.role === 'Admin' || user.role === 'Librarian') && (
                <Link
                  to="/reports"
                  className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/reports')
                      ? 'bg-[#081C15] text-[#D97706] border border-[#2D6A4F]'
                      : 'text-white/80 hover:text-white hover:bg-[#143527]'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#D97706]" />
                  <span className="hidden md:inline">Reports</span>
                </Link>
              )}

              {/* Dashboard */}
              <Link
                to="/dashboard"
                className={`text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  isActive('/dashboard') ||
                  isActive('/admin') ||
                  isActive('/librarian') ||
                  isActive('/staff') ||
                  isActive('/student')
                    ? 'bg-[#081C15] text-[#D97706] border border-[#2D6A4F]'
                    : 'text-white/80 hover:text-white hover:bg-[#143527]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#D97706]" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <div className="h-5 w-px bg-white/20 hidden sm:block mx-1" />

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Identity Chip */}
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-semibold text-white/90 hidden xl:inline">
                  {user.name}
                </span>
                {getRoleBadge(user.role)}
              </div>

              {/* Sign Out */}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-950/40 border border-transparent hover:border-rose-800 transition-all cursor-pointer ml-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl text-white/90 hover:text-white hover:bg-[#143527] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white shadow-md hover:shadow-lg transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
