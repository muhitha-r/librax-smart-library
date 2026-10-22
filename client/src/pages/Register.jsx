import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import libraryBg from '../assets/library-bg.jpg';
import {
  BookOpen,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Student', // Only 'Student' or 'Staff' allowed for public registration
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your institutional email address.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newUser = await register(
        formData.name.trim(),
        formData.email.trim(),
        formData.password,
        formData.role
      );
      setSuccessMsg(`Account created successfully! Welcome to Librax, ${newUser.name}.`);
      setTimeout(() => {
        const destination = newUser?.role === 'Staff' ? '/staff' : '/student';
        navigate(destination, { replace: true });
      }, 700);
    } catch (err) {
      setError(
        err.customMessage ||
          err.message ||
          'Registration failed. Institutional email may already be registered.'
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
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/40 my-6 transition-all">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="bg-[#1B4332] text-[#D97706] p-3 rounded-2xl mx-auto w-fit mb-3 shadow-md flex items-center justify-center border border-[#2D6A4F]/40">
            <BookOpen className="w-6 h-6 text-[#D97706]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] text-center tracking-tight">
            Librax
          </h1>
          <p className="text-sm text-slate-500 text-center mt-1">
            Create your library account
          </p>
        </div>

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

        {/* REGISTRATION FORM */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-name"
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }));
                  if (error) setError(null);
                }}
                placeholder="e.g. Alex Johnson"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1"
            >
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  if (error) setError(null);
                }}
                placeholder="name@domain.com"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Role Selection (Student or Staff only) */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="role-student-btn"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, role: 'Student' }));
                  if (error) setError(null);
                }}
                disabled={loading}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  formData.role === 'Student'
                    ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] font-semibold ring-1 ring-[#1B4332]'
                    : 'border-[#E5E7EB] bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <GraduationCap
                  className={`w-4 h-4 ${
                    formData.role === 'Student' ? 'text-[#1B4332]' : 'text-slate-400'
                  }`}
                />
                <span>Student</span>
              </button>
              <button
                type="button"
                id="role-staff-btn"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, role: 'Staff' }));
                  if (error) setError(null);
                }}
                disabled={loading}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  formData.role === 'Staff'
                    ? 'border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332] font-semibold ring-1 ring-[#1B4332]'
                    : 'border-[#E5E7EB] bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Briefcase
                  className={`w-4 h-4 ${
                    formData.role === 'Staff' ? 'text-[#1B4332]' : 'text-slate-400'
                  }`}
                />
                <span>Staff</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Admin &amp; Librarian accounts are provisioned exclusively by library administration.
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="reg-pass"
              className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-pass"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, password: e.target.value }));
                  if (error) setError(null);
                }}
                placeholder="At least 6 characters"
                disabled={loading}
                className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1F2937] transition-colors cursor-pointer p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="reg-conf-pass"
              className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reg-conf-pass"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }));
                  if (error) setError(null);
                }}
                placeholder="Re-enter password"
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E5E7EB] rounded-lg text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 focus:border-[#D97706] transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#D97706] hover:text-[#B45309] hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
