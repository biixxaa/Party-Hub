import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CheckoutModal } from '../components/CheckoutModal';
import {
  Megaphone,
  Eye,
  Heart,
  Flame,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Headphones,
  Lock,
  Building2,
  Award,
} from 'lucide-react';
import { Post } from '../types';

export const CreatorDashboard: React.FC = () => {
  const { user, hasActiveSubscription, refreshUser } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isCreatorPremium = hasActiveSubscription('CREATOR_PREMIUM');
  const isVerified = user?.verificationStatus === 'APPROVED';

  const activeSub = user?.activeSubscriptions?.find(s => s.type === 'CREATOR_PREMIUM' && s.status === 'ACTIVE');

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (isCreatorPremium && isVerified) {
        try {
          const res = await api.get('/posts/my-posts');
          setMyPosts(res.data.posts || []);
        } catch (err) {
          // If subscription or verification expired
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchMyPosts();
  }, [isCreatorPremium, isVerified]);

  // Aggregate engagement stats
  const totalViews = myPosts.reduce((acc, p) => acc + p.viewCount, 0);
  const totalLikes = myPosts.reduce((acc, p) => acc + p.likeCount, 0);
  const activeBoostedCount = myPosts.filter(p => p.isBoosted).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider">
              Platform Creator Console
            </span>
            {isVerified ? (
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Identity Verified
              </span>
            ) : (
              <Link
                to="/verification"
                className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-950/60 border border-amber-500/30 text-amber-400 hover:bg-amber-900/50"
              >
                <Clock className="w-3 h-3" /> Status: {user?.verificationStatus}
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
            Welcome, {user?.fullName}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Broadcast promotional campaigns for your applications, websites, and digital lounges.
          </p>
        </div>

        {/* Upgrade / Active Badge */}
        {!isCreatorPremium ? (
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 shadow-xl shadow-pink-600/30 transition-all self-start md:self-auto"
          >
            <Crown className="w-4 h-4 text-amber-300" />
            <span>Activate Creator Premium ($100/wk)</span>
          </button>
        ) : (
          <div className="px-4 py-2.5 rounded-2xl glass-panel border-pink-500/40 bg-pink-950/20 text-pink-300 flex items-center gap-2 text-sm font-semibold">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs uppercase tracking-wider text-pink-400 font-bold">Creator Premium Active</div>
              <div className="text-[11px] text-gray-300">
                Expires: {activeSub ? new Date(activeSub.expirationDate).toLocaleDateString() : 'Active'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification & Subscription Status Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Verification Card */}
        <div className="glass-panel rounded-2xl p-6 border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-pink-600/20 text-pink-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Identity Verification</h3>
                <p className="text-xs text-gray-400 mt-0.5">Safety & platform legitimacy</p>
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

          <p className="text-xs text-gray-300 mt-4 leading-relaxed">
            {isVerified
              ? 'Your developer / platform identity has been approved by admin moderators.'
              : 'Submit a screenshot of your platform admin console to unlock promotional publishing permissions.'}
          </p>

          {!isVerified && (
            <Link
              to="/verification"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300"
            >
              <span>Submit Profile Screenshot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Creator Premium Subscription Card */}
        <div className="glass-panel rounded-2xl p-6 border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Creator Premium ($100/wk)</h3>
                <p className="text-xs text-gray-400 mt-0.5">Publishing & analytics access</p>
              </div>
            </div>

            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                isCreatorPremium
                  ? 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border border-white/10 text-gray-400'
              }`}
            >
              {isCreatorPremium ? 'Active' : 'Required'}
            </span>
          </div>

          <p className="text-xs text-gray-300 mt-4 leading-relaxed">
            {isCreatorPremium
              ? `Your Creator Premium access is active until ${
                  activeSub ? new Date(activeSub.expirationDate).toLocaleDateString() : 'expiration'
                }. You can publish posts, view detailed impression analytics, and see which Agents liked your campaigns.`
              : 'Publishing and managing promotional posts requires approved verification and an active Creator Premium subscription ($100 USD / week).'}
          </p>

          {!isCreatorPremium ? (
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              <span>Activate Creator Subscription ($100/wk)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to="/creator/posts"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Manage Promotional Posts & Stats</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Engagement Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Megaphone className="w-4 h-4 text-purple-400" />
            <span>Campaigns</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{myPosts.length}</div>
          <div className="text-[11px] text-gray-500 mt-1">Total promotional posts</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Eye className="w-4 h-4 text-pink-400" />
            <span>Impressions</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-gray-500 mt-1">Total post views logged</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Heart className="w-4 h-4 text-rose-400" />
            <span>Agent Likes</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalLikes}</div>
          <div className="text-[11px] text-gray-500 mt-1">Likes received from agents</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 border-white/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Active Boosts</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{activeBoostedCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Sponsored 24h promotions</div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <h2 className="text-lg font-bold text-white mb-4">Creator Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/creator/posts"
          className="glass-panel rounded-2xl p-5 border-white/10 glass-panel-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Manage Promotional Posts</h3>
            <p className="text-xs text-gray-400 mt-1">
              Create campaigns, upload platform media, track likers, and activate 24h post boosts.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-400">
            <span>Manage Posts & Likers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          to="/feed"
          className="glass-panel rounded-2xl p-5 border-white/10 glass-panel-hover flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center mb-3">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">View Live Public Feed</h3>
            <p className="text-xs text-gray-400 mt-1">
              See how your promotional banners and sponsored placements appear to Agents.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-pink-400">
            <span>Open Public Feed</span>
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
            <h3 className="font-bold text-white text-base">Contact Platform Admin</h3>
            <p className="text-xs text-gray-400 mt-1">
              Direct communication with platform moderators for verification or billing questions.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-400">
            <span>Support Request</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        type="CREATOR_PREMIUM"
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
