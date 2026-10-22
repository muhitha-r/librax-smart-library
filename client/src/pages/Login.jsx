import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import libraryBg from '../assets/library-bg.jpg';
import {
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Shield,
  LogOut,
} from 'lucide-react';

export default function Login() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sign In Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sign In Submission Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loggedUser = await login(email.trim(), password);
      setSuccessMsg(`Authentication successful. Redirecting ${loggedUser.name}...`);
      setTimeout(() => {
        const destination =
          location.state?.from?.pathname &&
            location.state?.from?.pathname !== '/' &&
            location.state?.from?.pathname !== '/login'
            ? location.state.from.pathname
            : loggedUser.role === 'Admin'
              ? '/admin'
              : loggedUser.role === 'Librarian'
                ? '/librarian'
                : loggedUser.role === 'Staff'
                  ? '/staff'
                  : '/student';
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      setError(
        err.customMessage ||
        err.message ||
        'Authentication failed. Please check your credentials.'
      );
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat selection:bg-[#D97706]/20 selection:text-[#B45309]"
      style={{ 
        backgroundImage: `linear-gradient(rgba(27, 67, 50, 0.78), rgba(8, 28, 21, 0.85)), url(${libraryBg})` 
      }}
    >
      <div className="relative z-10 w-full max-w-md bg-[#F9F7F1]/90 backdrop-blur-md border border-[#E6E1D3] shadow-2xl rounded-2xl p-8 my-6 transition-all">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="bg-[#1B4332] text-[#D97706] p-3 rounded-2xl mx-auto w-fit mb-3 shadow-md flex items-center justify-center border border-[#2D6A4F]/40">
            <BookOpen className="w-6 h-6 text-[#D97706]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B4332] text-center tracking-tight">
            Librax
          </h1>
          <p className="text-sm text-stone-600 text-center mt-1">
            Sign in to your account
          </p>
        </div>

        {/* When User is ALREADY Authenticated */}
        {isAuthenticated && user ? (
          <div className="space-y-5 text-center">
            <div className="p-4 rounded-xl bg-white/70 border border-[#E6E1D3]">
              <p className="text-xs text-stone-500">Currently signed in as:</p>
              <p className="text-base font-bold text-[#1B4332] mt-0.5">{user.name}</p>
              <p className="text-xs font-mono text-stone-500">{user.email}</p>
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D97706]/15 text-[#B45309] border border-[#D97706]/30">
                  <Shield className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>{user.role}</span>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  const destination =
                    user.role === 'Admin'
                      ? '/admin'
                      : user.role === 'Librarian'
                        ? '/librarian'
                        : user.role === 'Staff'
                          ? '/staff'
                          : '/student';
                  navigate(destination);
                }}
                className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full mt-1 text-xs text-stone-500 hover:text-rose-600 transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Real-World Production Sign In Flow */
          <div>
            {/* Feedback Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Forgot Password Notice */}
            {showForgotNotice && (
              <div className="mb-4 p-3 bg-[#F4EFE6] border border-[#D5CEBE] rounded-lg text-xs text-stone-800 flex items-start justify-between gap-2 transition-all">
                <div>
                  <p className="font-semibold text-[#92400E]">Password Reset Assistance</p>
                  <p className="mt-0.5 text-stone-600 leading-relaxed">
                    Please contact your institutional library administrator or IT help desk at{' '}
                    <a
                      href="mailto:admin@librax.com"
                      className="font-medium text-[#D97706] underline"
                    >
                      admin@librax.com
                    </a>{' '}
                    to verify your identity and reset your credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer shrink-0"
                  aria-label="Close notice"
                >
                  ✕
                </button>
              </div>
            )}

            {/* SIGN IN FORM */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@domain.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/85 border border-[#D5CEBE] text-stone-900 rounded-lg text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="signin-password"
                    className="block text-xs font-semibold text-[#2D6A4F] uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotNotice((prev) => !prev)}
                    className="text-xs text-[#D97706] hover:text-[#B45309] font-medium hover:underline transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/85 border border-[#D5CEBE] text-stone-900 rounded-lg text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D97706] transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Section */}
            <div className="mt-6 pt-5 border-t border-[#E6E1D3] text-center">
              <p className="text-xs text-stone-500">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#D97706] hover:text-[#B45309] hover:underline transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
