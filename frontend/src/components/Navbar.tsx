import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Users,
  ShieldCheck,
  CreditCard,
  Headphones,
  LogOut,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  // Verification status badge helper
  const renderVerificationBadge = () => {
    if (!user) return null;
    if (user.role === 'ADMIN') {
      return (
        <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-950/60 border border-red-500/30 text-red-400">
          <ShieldAlert className="w-3 h-3" /> Admin
        </span>
      );
    }

    switch (user.verificationStatus) {
      case 'APPROVED':
        return (
          <Link
            to="/verification"
            className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors"
            title="Identity Verified"
          >
            <CheckCircle2 className="w-3 h-3" /> Verified
          </Link>
        );
      case 'PENDING':
        return (
          <Link
            to="/verification"
            className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-950/60 border border-amber-500/30 text-amber-400 hover:bg-amber-900/50 transition-colors"
            title="Verification In Review"
          >
            <Clock className="w-3 h-3 animate-spin" /> Pending Review
          </Link>
        );
      case 'REJECTED':
        return (
          <Link
            to="/verification"
            className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-rose-950/60 border border-rose-500/30 text-rose-400 hover:bg-rose-900/50 transition-colors"
            title="Verification Rejected - Re-submit screenshot"
          >
            <XCircle className="w-3 h-3" /> Action Required
          </Link>
        );
      default:
        return (
          <Link
            to="/verification"
            className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-950/60 border border-purple-500/30 text-purple-400 hover:bg-purple-900/50 transition-colors"
            title="Submit Profile Screenshot for Verification"
          >
            <ShieldCheck className="w-3 h-3" /> Verify Identity
          </Link>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 bg-[#0b0c10]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent tracking-tight">
                  Party Hub
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-purple-400 font-semibold -mt-1">
                  Promotions
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                <Link
                  to="/feed"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive('/feed') || isActive('/')
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Megaphone className="w-4 h-4 text-purple-400" />
                  Feed
                </Link>

                {/* Agent Links */}
                {user?.role === 'AGENT' && (
                  <>
                    <Link
                      to="/agent/dashboard"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        isActive('/agent/dashboard')
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                      Dashboard
                    </Link>
                    <Link
                      to="/agents"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        isActive('/agents')
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4 text-purple-400" />
                      Agents
                    </Link>
                    <Link
                      to="/messages"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        isActive('/messages')
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      Messages
                      {!hasActiveSubscription('AGENT_PREMIUM') && (
                        <span className="text-[10px] bg-amber-500/20 border border-amber-500/40 text-amber-300 px-1.5 rounded uppercase">
                          VIP
                        </span>
                      )}
                    </Link>
                  </>
                )}

                {/* Platform Creator Links */}
                {user?.role === 'PLATFORM_CREATOR' && (
                  <>
                    <Link
                      to="/creator/dashboard"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        isActive('/creator/dashboard')
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                      Dashboard
                    </Link>
                    <Link
                      to="/creator/posts"
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                        isActive('/creator/posts')
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Megaphone className="w-4 h-4 text-purple-400" />
                      My Posts & Stats
                    </Link>
                  </>
                )}

                {/* Admin Links */}
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive('/admin')
                        ? 'bg-red-600/20 text-red-300 border border-red-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    Admin Portal
                  </Link>
                )}

                <Link
                  to="/subscriptions"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive('/subscriptions')
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-purple-400" />
                  Subscriptions
                </Link>

                <Link
                  to="/contact-admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive('/contact-admin')
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Headphones className="w-4 h-4 text-purple-400" />
                  Contact Admin
                </Link>
              </nav>
            )}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Verification Badge */}
                {renderVerificationBadge()}

                {/* Role Pill */}
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-white leading-tight">
                    {user?.fullName}
                  </span>
                  <span className="text-[11px] text-purple-400 font-medium uppercase tracking-wide">
                    {user?.role.replace('_', ' ')}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white rounded-lg transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg shadow-lg shadow-purple-600/25 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
