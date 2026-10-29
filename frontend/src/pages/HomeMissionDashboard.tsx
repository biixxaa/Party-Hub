import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Rocket,
  ShieldCheck,
  Users,
  Megaphone,
  Flame,
  Award,
  Crown,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Building2,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Eye,
  Heart,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const HomeMissionDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'creators' | 'agents' | 'trust'>('creators');

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-100 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-white/5">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/20 via-pink-600/15 to-transparent blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-purple-950/50">
              <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
              <span>Party Hub Platform Mission & Strategic Goals</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              The Verified Promotional Bridge for{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                Agents & Creators
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl mx-auto">
              Party Hub is built to solve one central challenge: connecting digital platforms, apps, and streaming ecosystems with verified agency talent while strictly eliminating middleman fraud and unauthorized channels.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link
                    to={
                      user?.role === 'ADMIN'
                        ? '/admin'
                        : user?.role === 'AGENT'
                        ? '/agent/dashboard'
                        : '/creator/dashboard'
                    }
                    className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group"
                  >
                    <span>Go to My Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/feed"
                    className="px-6 py-3.5 rounded-xl font-semibold text-sm text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2"
                  >
                    <Megaphone className="w-4 h-4 text-purple-400" />
                    <span>Explore Feed</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register?role=AGENT"
                    className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group"
                  >
                    <span>Join as Verified Agent</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/register?role=PLATFORM_CREATOR"
                    className="px-6 py-3.5 rounded-xl font-bold text-sm text-pink-300 bg-pink-950/40 hover:bg-pink-900/40 border border-pink-500/30 transition-all flex items-center gap-2"
                  >
                    <Rocket className="w-4 h-4 text-pink-400" />
                    <span>Promote Your Platform</span>
                  </Link>

                  <Link
                    to="/login"
                    className="px-5 py-3.5 rounded-xl font-medium text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10 text-left">
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-lg">
                  <ShieldCheck className="w-5 h-5" /> 100%
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Admin-Verified IDs</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-pink-400 font-bold text-lg">
                  <Flame className="w-5 h-5" /> 24h Boost
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Top-Feed Priority</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg">
                  <CreditCard className="w-5 h-5" /> Chapa + Card
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Telebirr & CBE Pay</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
                  <Lock className="w-5 h-5" /> Sec. 7 Shield
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Zero Spam Channels</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The 3 Core Goals Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs uppercase font-bold text-purple-400 tracking-widest mb-2">
            Mission Pillars
          </h2>
          <h3 className="text-3xl font-extrabold text-white">
            The Three Main Goals of Party Hub
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            Every feature on Party Hub is engineered to serve three fundamental objectives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Goal 1 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-xl hover:shadow-purple-950/20">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-600/30 group-hover:scale-110 transition-transform">
                <Megaphone className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                Goal 01
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                High-Impact Promotion for Creators
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Platform Creators can publish rich campaign banners with instant destination redirects, activate 24-hour sponsored boosts for top visibility, and see the exact verified Agents engaging with their post.
              </p>

              <ul className="space-y-2.5 text-xs text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>24-Hour Post Boosting ($50 USD / 24h)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Real-time impression & verified Agent like tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Transparent inspection of Agent profiles who liked posts</span>
                </li>
              </ul>
            </div>

            <Link
              to={isAuthenticated ? '/creator/dashboard' : '/register?role=PLATFORM_CREATOR'}
              className="inline-flex items-center gap-2 text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors pt-4 border-t border-white/10"
            >
              <span>Creator Campaign Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Goal 2 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-pink-500/40 transition-all flex flex-col justify-between group shadow-xl hover:shadow-pink-950/20">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-pink-600/30 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-1">
                Goal 02
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                Elite Agency Agent Networking
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Verified Agents gain official recognition for their Agency Centers and Super Levels. With Agent Premium, members unlock private direct messaging to negotiate campaigns and build cross-agency alliances.
              </p>

              <ul className="space-y-2.5 text-xs text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Verified Agency Center & Super Level Badges</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Private Direct Messaging (VIP Agent Network)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Agent Directory with Follower & Following ecosystem</span>
                </li>
              </ul>
            </div>

            <Link
              to={isAuthenticated ? '/agent/dashboard' : '/register?role=AGENT'}
              className="inline-flex items-center gap-2 text-xs font-bold text-pink-300 hover:text-pink-200 transition-colors pt-4 border-t border-white/10"
            >
              <span>Agent Network Portal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Goal 3 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-xl hover:shadow-amber-950/20">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                Goal 03
              </div>
              <h4 className="text-xl font-bold text-white mb-3">
                Zero-Spam & Trusted Transactions
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Identity authenticity is verified directly by Platform Administrators. Off-platform contact sharing (WhatsApp/Telegram links) is blocked system-wide to maintain a professional, secure environment.
              </p>

              <ul className="space-y-2.5 text-xs text-gray-400 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Direct Admin Challenge Verification Protocol</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Section 7 Prohibited Link & Number Protection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Chapa Integration (Telebirr/CBE) & Instant Card Pay</span>
                </li>
              </ul>
            </div>

            <Link
              to="/subscriptions"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors pt-4 border-t border-white/10"
            >
              <span>View Verified Memberships</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Interactive Experience Walkthrough */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
                Interactive Showcase
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                How Party Hub Works in Action
              </h3>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1.5 rounded-2xl bg-black/40 border border-white/10 max-w-md">
              <button
                onClick={() => setActiveTab('creators')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'creators'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Creator Journey
              </button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'agents'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Agent Journey
              </button>
              <button
                onClick={() => setActiveTab('trust')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'trust'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Trust & Verification
              </button>
            </div>
          </div>

          {/* Tab 1: Creators */}
          {activeTab === 'creators' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">1</span>
                    Publish Platform Campaign
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Creators upload vibrant banners, write promotional pitches, and link directly to official mobile apps, web portals, or streaming live streams.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs">2</span>
                    Boost for 24h Top Visibility ($50 USD)
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Gain top-of-feed priority pinned with an eye-catching Sponsored fire badge. Track verified views and real-time click impressions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                    Inspect Exact Agency Likers
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    View the full list of verified Agents who liked the post. Discover their Agency Centers and Super Levels to identify optimal partners.
                  </p>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="p-6 rounded-2xl bg-black/40 border border-purple-500/30 shadow-2xl relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600 text-white text-xs font-extrabold shadow-md shadow-pink-600/30">
                    <Flame className="w-3.5 h-3.5" /> SPONSORED PROMOTION
                  </span>
                  <span className="text-xs text-purple-300 font-semibold">24h Priority Feed</span>
                </div>
                <div className="h-40 rounded-xl bg-gradient-to-br from-purple-900/60 to-pink-900/40 border border-white/10 flex items-center justify-center text-gray-400 text-sm mb-3">
                  <div className="text-center">
                    <Megaphone className="w-8 h-8 text-pink-400 mx-auto mb-1 animate-bounce" />
                    <span className="font-bold text-white">Live Platform Banner</span>
                  </div>
                </div>
                <h4 className="font-bold text-white text-base">Next-Gen Streaming & Agency Host Portal</h4>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-purple-400" /> 2,490 Verified Views</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" /> 184 Agent Likes</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Agents */}
          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">1</span>
                    Verified Agency Credentialing
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Display your official Agency Center (e.g., Star Prime Agency #88) and Super Level status directly on your profile and directory cards.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-xs">2</span>
                    Agent Premium VIP Direct Messaging ($50 USD/wk)
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Unlock private direct messages with any fellow verified agent on the platform. Initiate high-level talks, cross-promotions, and co-hostings.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                    Follow & Network with Talent Leaders
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Build your professional follower base, track partner agencies, and stay notified when leading platforms publish lucrative new campaigns.
                  </p>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="p-6 rounded-2xl bg-black/40 border border-pink-500/30 shadow-2xl relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
                    SJ
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">Sarah Jenkins</h4>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED
                      </span>
                    </div>
                    <div className="text-xs text-purple-300 font-semibold mt-0.5">
                      Star Prime Agency #88 • Super Level 10 (Diamond)
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" /> Active VIP Agent Premium</span>
                  <span className="text-[10px] text-gray-400">Chapa Paid</span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-gray-300">
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-pink-400" /> Private Networking Thread
                  </div>
                  "Hello Leo, our agency is looking for co-hosts for this weekend's boosted platform campaign..."
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Trust */}
          {activeTab === 'trust' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs">1</span>
                    Direct Admin Authentication Protocol
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    To eliminate fake accounts, Platform Administrators directly message candidates on their shared platform user ID with challenge codes before approving their Agency badge.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs">2</span>
                    Section 7 Contact Shield (No Off-Platform Spam)
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Server-enforced filters strictly prohibit sharing WhatsApp links (`wa.me`), Telegram usernames (`t.me`), or phone numbers across posts, bios, and messages to prevent external scams.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">3</span>
                    Chapa Multi-Payment Gateway Support
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-8">
                    Seamless payments powered by Chapa: supports Telebirr, CBEBirr, Commercial Bank of Ethiopia, QR checkout, and international Visa/Mastercard.
                  </p>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="p-6 rounded-2xl bg-black/40 border border-amber-500/30 shadow-2xl relative">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-4">
                  <ShieldCheck className="w-5 h-5" /> Admin Direct Verification Protocol
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <span className="text-gray-400">Platform User ID:</span>
                    <span className="font-bold text-white font-mono">ID-992014</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <span className="text-gray-400">Claimed Agency Center:</span>
                    <span className="font-bold text-purple-300">Star Prime Agency #88</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <span className="text-gray-400">Admin Authentication:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Challenge Code Confirmed
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-center font-bold">
                    Official Verification Status: APPROVED
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Complete Ecosystem Flowchart Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs uppercase font-bold text-pink-400 tracking-widest mb-2">
            The Complete Lifecycle
          </h2>
          <h3 className="text-3xl font-extrabold text-white">
            From Registration to Monetized Growth
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative">
            <div className="text-3xl font-extrabold text-purple-500/30 mb-2 font-mono">01</div>
            <h4 className="font-bold text-white text-base mb-2">Sign Up & Role Selection</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Choose your path as an <strong>Agent</strong> (representing agency talent) or a <strong>Platform Creator</strong> (promoting an app/platform).
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative">
            <div className="text-3xl font-extrabold text-pink-500/30 mb-2 font-mono">02</div>
            <h4 className="font-bold text-white text-base mb-2">Admin Identity Verification</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Submit your Platform ID & Agency Center. Admins challenge-verify your handle to issue your official verified badge.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative">
            <div className="text-3xl font-extrabold text-amber-500/30 mb-2 font-mono">03</div>
            <h4 className="font-bold text-white text-base mb-2">Campaigns & 24h Boost</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Creators publish promotional media and activate 24-hour top boosts. Agents discover, like, and bookmark promising platforms.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-panel border border-white/10 relative">
            <div className="text-3xl font-extrabold text-emerald-500/30 mb-2 font-mono">04</div>
            <h4 className="font-bold text-white text-base mb-2">VIP Synergy & Partnerships</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Premium Agents initiate private messaging to negotiate agency deals, co-hostings, and direct promotional collaborations.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-purple-900/50 via-pink-900/40 to-black border border-purple-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[80px] pointer-events-none rounded-full" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-4" />
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Expand Your Reach on Party Hub?
            </h3>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-8">
              Join leading Agency Centers and emerging Platforms today. Take advantage of verified networking, sponsored campaign boosts, and secure payments.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {isAuthenticated ? (
                <Link
                  to="/feed"
                  className="px-8 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group"
                >
                  <span>Explore Promotional Feed</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 group"
                  >
                    <span>Create Your Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    to="/login"
                    className="px-6 py-4 rounded-xl font-semibold text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

