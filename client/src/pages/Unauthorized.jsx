import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center bg-white border border-[#E5E7EB] rounded-3xl p-8 shadow-xl">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 items-center justify-center mb-4">
          <ShieldX className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#1F2937] mb-2">
          403 - Access Denied
        </h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Your current account role (<strong className="text-[#1B4332]">{user?.role || 'Guest'}</strong>) does not have permission to view this section of Librax.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to My Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
