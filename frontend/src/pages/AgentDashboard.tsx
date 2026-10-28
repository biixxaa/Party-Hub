import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  ShieldCheck,
  Crown,
  MessageSquare,
  Users,
  Megaphone,
  Heart,
  Headphones,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  ArrowRight,
  Building2,
  Award,
  Hash,
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const { user, hasActiveSubscription, refreshUser } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [followedCount, setFollowedCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  const isPremium = hasActiveSubscription('AGENT_PREMIUM');
  const isVerified = user?.verificationStatus === 'APPROVED';

  // Find active subscription details
  const activeSub = user?.activeSubscriptions?.find(s => s.type === 'AGENT_PREMIUM' && s.status === 'ACTIVE');

  useEffect(() => {
    const fetchAgentStats = async () => {
      try {
        if (user) {
          const res = await api.get(`/agents/${user.id}`);
          setFollowedCount(res.data.agent.followingCount || 0);
          setFollowerCount(res.data.agent.followersCount || 0);
        }
      } catch (err) {
        // Silently handle if initial profile check
      }
    };
    fetchAgentStats();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
              Agent Portal
            </span>
            {isVerified ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Verified Real User
              </span>
            ) : (
              <Link
                to="/verification"
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-950/60 border border-amber-500/30 text-amber-400 hover:bg-amber-900/50"
              >
                <Clock className="w-3 h-3" /> Verification Status: {user?.verificationStatus}
              </Link>
            )}

            {user?.superLevel && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold bg-pink-950/60 border border-pink-500/30 text-pink-300">
                <Award className="w-3 h-3 text-pink-400" /> {user.superLevel}
              </span>
            )}
            {user?.agencyCenter && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-950/60 border border-purple-500/30 text-purple-300">
                <Building2 className="w-3 h-3 text-purple-400" /> {user.agencyCenter}
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Hello, {user?.fullName}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your agent talent representation, browse promotional campaigns, and network privately.
          </p>
        </div>

        {/* Upgrade / Active Badge */}
        {!isPremium ? (
          <div className="flex flex-col items-start md:items-end gap-1.5 self-start md:self-auto">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 transition-all"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Upgrade to Agent Premium ($50/wk)</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pay via <strong className="text-emerald-400">Chapa</strong> (Telebirr / CBE) or Card</span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2.5 rounded-2xl glass-panel border-amber-500/40 bg-amber-950/20 text-amber-300 flex items-center gap-2 text-sm font-semibold">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs uppercase tracking-wider text-amber-400 font-bold">VIP Active</div>
              <div className="text-[11px] text-gray-300">
                Expires: {activeSub ? new Date(activeSub.expirationDate).toLocaleDateString() : 'Active'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription & Verification Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Verification Card */}
        <div className="glass-panel rounded-2xl p-6 border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Direct Admin Verification</h3>
                <p className="text-xs text-gray-400 mt-0.5">Real User & Super Level Authentication</p>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                isVerified
                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
              }`}
            >
              {user?.verificationStatus}
            </span>
          </div>

          <div className="text-xs text-gray-300 mt-4 leading-relaxed">
            {isVerified ? (
              <p>
                Your identity is confirmed by platform administrators. Authenticated for {user?.agencyCenter || 'Agency Center'} at {user?.superLevel || 'Super Level'}.
              </p>
            ) : user?.verificationStatus === 'PENDING' ? (
              <p>
                Your details are currently being reviewed. Admins will direct-message your shared ID (<span className="font-mono text-purple-300">{user?.platformId || 'Pending'}</span>) to verify that you are the real user before activating your Super Level.
              </p>
            ) : (
              <p>
                Share your Platform ID and Agency Center so an Administrator can message you directly and verify your Super Level.
              </p>
            )}
          </div>

          <Link
            to="/verification"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300"
          >
            <span>{isVerified ? 'View Verification Details' : 'Go to Identity Verification & Share ID'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Premium Messaging Status Card */}
        <div className="glass-panel rounded-2xl p-6 border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-pink-600/20 text-pink-400">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Agent Premium ($50/wk)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Private messaging access</p>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                isPremium
                  ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-gray-400'
              }`}
            >
              {isPremium ? 'Active' : 'Not Subscribed'}
            </span>
          </div>

          <p className="text-xs text-gray-300 mt-4 leading-relaxed">
            {isPremium
              ? `You have active access to private direct messaging with other verified Agents until ${
                  activeSub ? new Date(activeSub.expirationDate).toLocaleDateString() : 'expiration'
                }.`
              : 'Direct messaging requires approved identity verification and an active Agent Premium subscription ($50 USD / week).'}
          </p>

          {!isPremium ? (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              <span>Unlock Private Messaging ($50/wk)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/messages"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Open Private Inbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Following</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{followedCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Agents you follow</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Users className="w-4 h-4 text-pink-400" />
            <span>Followers</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{followerCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Agents following you</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Messaging</span>
          </div>
          <div className="text-sm font-bold text-white mt-1">
            {isPremium && isVerified ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Unlocked
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Lock className="w-4 h-4" /> Premium VIP
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Direct agent chats</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Campaigns</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">Live</div>
          <div className="text-[11px] text-gray-500 mt-1">Explore promotional feed</div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <h2 className="text-lg font-bold text-white mb-4">Quick Shortcuts</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/feed"
          className="glass-panel rounded-2xl p-5 border-white/10 glass-panel-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Promotional Feed</h3>
            <p className="text-xs text-gray-400 mt-1">
              Browse platform showcases, sponsored apps, and like posts.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-400">
            <span>Explore Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/agents"
          className="glass-panel rounded-2xl p-5 border-white/10 glass-panel-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Discover Agents</h3>
            <p className="text-xs text-gray-400 mt-1">
              Network with other digital talent agents, view profiles, and follow.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-pink-400">
            <span>Browse Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/messages"
          className="glass-panel rounded-2xl p-5 border-white/10 glass-panel-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Private Messaging</h3>
            <p className="text-xs text-gray-400 mt-1">
              Encrypted direct conversations between verified Agent Premium members.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-400">
            <span>Open Messages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/contact-admin"
          className="glass-panel rounded-2xl p-5 border-white/10 glass-panel-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Contact Admin</h3>
            <p className="text-xs text-gray-400 mt-1">
              Submit support inquiries, compliance questions, or billing assistance.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-400">
            <span>Submit Ticket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        type="AGENT_PREMIUM"
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
