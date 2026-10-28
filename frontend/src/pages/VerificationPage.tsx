import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  Eye,
  Building2,
  Sparkles,
  MessageSquare,
  Hash,
  Award,
  Info,
  Crown,
  Star,
  Smartphone,
  Check
} from 'lucide-react';
import { VerificationSubmission } from '../types';

const POPULAR_APPS = ['Poppo Live', 'Bigo Live', 'Chamet', 'TikTok Live', 'Tango Live', 'Uplive', 'Mico Live'];

export const VerificationPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [workedApp, setWorkedApp] = useState(user?.workedApp || '');
  const [workedAppId, setWorkedAppId] = useState(user?.workedAppId || user?.platformId || '');
  const [agencyCenter, setAgencyCenter] = useState(user?.agencyCenter || '');
  const [superLevel, setSuperLevel] = useState(user?.superLevel || 'Super Level 1');
  const [pastExperience, setPastExperience] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<VerificationSubmission[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.get('/verification/status');
      setSubmissions(res.data.submissions || []);
      if (res.data.workedApp && !workedApp) setWorkedApp(res.data.workedApp);
      if (res.data.workedAppId && !workedAppId) setWorkedAppId(res.data.workedAppId);
      if (res.data.agencyCenter && !agencyCenter) setAgencyCenter(res.data.agencyCenter);
      if (res.data.superLevel && !superLevel) setSuperLevel(res.data.superLevel);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workedApp.trim()) {
      setError('Please mention which app you have worked on (e.g. Poppo Live, Bigo Live, Chamet, TikTok Live).');
      return;
    }
    if (!workedAppId.trim()) {
      setError('Please provide your ID on that app so an Admin can direct-message you to verify your identity.');
      return;
    }
    if (!agencyCenter.trim()) {
      setError('Please provide your Agency Center to authenticate your representation and Super Level.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('workedApp', workedApp.trim());
    formData.append('workedAppId', workedAppId.trim());
    formData.append('platformId', workedAppId.trim());
    formData.append('agencyCenter', agencyCenter.trim());
    formData.append('superLevel', superLevel.trim() || 'Super Level 1');
    if (pastExperience.trim()) formData.append('pastExperience', pastExperience.trim());
    if (notes.trim()) formData.append('notes', notes.trim());
    if (selectedFile) formData.append('screenshot', selectedFile);

    try {
      const res = await api.post('/verification/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(res.data.message || 'Verification submitted. Admins will review your past experience and message your shared ID shortly.');
      setSelectedFile(null);
      setPreviewUrl(null);
      await refreshUser();
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit verification details.');
    } finally {
      setIsUploading(false);
    }
  };

  const status = user?.verificationStatus || 'UNSUBMITTED';
  const latestSub = submissions[0] || null;
  const experienceLevel = user?.experienceLevel || latestSub?.experienceLevel || 'Level B';

  // Helper for level badge colors and description
  const getLevelBadge = (lvl?: string | null) => {
    const raw = (lvl || 'Level B').toUpperCase();
    if (raw.includes('A')) {
      return {
        label: 'Level A — Elite Master Host / Agent',
        short: 'Level A',
        badgeClass: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-amber-400/50 text-amber-300 shadow-amber-500/20',
        pillClass: 'bg-amber-400 text-black',
        icon: Crown,
        desc: 'Top-tier veteran with verified high revenue, massive host portfolio, and proven agency leadership.',
      };
    }
    if (raw.includes('B')) {
      return {
        label: 'Level B — Senior Pro Host / Agent',
        short: 'Level B',
        badgeClass: 'bg-gradient-to-r from-purple-500/20 via-pink-500/30 to-purple-500/20 border-purple-400/50 text-purple-200 shadow-purple-500/20',
        pillClass: 'bg-purple-400 text-black',
        icon: Star,
        desc: 'Proven host/agent with consistent monthly targets, strong talent roster, and reputable agency partnership.',
      };
    }
    if (raw.includes('C')) {
      return {
        label: 'Level C — Intermediate Host / Agent',
        short: 'Level C',
        badgeClass: 'bg-gradient-to-r from-cyan-500/20 via-blue-500/30 to-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-cyan-500/20',
        pillClass: 'bg-cyan-400 text-black',
        icon: ShieldCheck,
        desc: 'Active verified live-streamer or agent with steady engagement and verified platform history.',
      };
    }
    return {
      label: 'Level D — Rising / Entry Host / Agent',
      short: 'Level D',
      badgeClass: 'bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-emerald-500/20 border-emerald-400/50 text-emerald-200 shadow-emerald-500/20',
      pillClass: 'bg-emerald-400 text-black',
      icon: Sparkles,
      desc: 'Emerging talent or new agency account establishing track record on Party Hub.',
    };
  };

  const levelInfo = getLevelBadge(experienceLevel);
  const LevelIcon = levelInfo.icon;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Title */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-900/80 to-pink-900/80 border border-purple-500/40 text-purple-200 text-xs font-semibold mb-3 shadow-lg shadow-purple-950/50">
          <ShieldCheck className="w-4 h-4 text-pink-400" />
          First Deploy Direct Admin Authentication
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Agent Verification & Experience Level Rating
        </h1>
        <p className="text-sm text-gray-400 mt-2 max-w-3xl leading-relaxed">
          To ensure genuine identity, share <span className="text-purple-300 font-semibold">which app you have worked on</span> and your <span className="text-purple-300 font-semibold">account ID</span>, along with your <span className="text-pink-300 font-semibold">Agency Center</span>. Platform Admins will direct-message you on that ID to authenticate you, and evaluate your past experience to award your official <span className="text-amber-300 font-bold">Level A, B, C, or D</span> rating!
        </p>
      </div>

      {/* 3-Step Verification Flow Banner */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border-purple-500/30 bg-purple-950/20">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-xs">
              1
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Worked App & ID</span>
          </div>
          <p className="text-[12px] text-gray-400 leading-normal">
            Mention the app you worked on (Poppo, Bigo, Chamet, etc.), your ID, Agency Center, and your past track record.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-pink-500/30 bg-pink-950/20">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-300 font-bold text-xs">
              2
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Admin Direct Message</span>
          </div>
          <p className="text-[12px] text-gray-400 leading-normal">
            Admins message you on your submitted ID to verify that you are the real person who owns the account.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
              3
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">Level A/B/C/D Rating</span>
          </div>
          <p className="text-[12px] text-gray-400 leading-normal">
            Admin assigns your official Experience Tier (Level A, B, C, or D) and unlocks your verified agency badge!
          </p>
        </div>
      </div>

      {/* Status Hero Card */}
      <div className="mb-8">
        {status === 'APPROVED' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-purple-950/20 to-transparent shadow-2xl shadow-emerald-950/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Identity Verified & Authenticated
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Official Verified Agent
                  </h3>
                  <p className="text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
                    Admin confirmed your real identity on <strong className="text-purple-300">{user?.workedApp || 'Live App'}</strong> (ID: <strong className="text-purple-300 font-mono">{user?.workedAppId || user?.platformId || 'Verified'}</strong>). Your official Experience Rating is active throughout Party Hub!
                  </p>
                </div>
              </div>

              {/* Badges Stack */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                {/* Official Experience Level Badge */}
                <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3.5 ${levelInfo.badgeClass}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${levelInfo.pillClass}`}>
                    <LevelIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300 block">
                      Admin Experience Rating
                    </span>
                    <span className="text-base font-extrabold text-white block">
                      {user?.experienceLevel || levelInfo.label}
                    </span>
                    <span className="text-[11px] text-gray-300 block mt-0.5 max-w-xs">
                      {levelInfo.desc}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-200">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>{user?.agencyCenter || 'Agency Center'}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-950/60 border border-pink-500/30 text-pink-300 font-semibold">
                    <Award className="w-3.5 h-3.5 text-pink-400" />
                    <span>{user?.superLevel || 'Super Level VIP'}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-mono">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user?.workedApp || 'App'} ID: {user?.workedAppId || user?.platformId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-amber-950/10 to-transparent shadow-2xl shadow-amber-950/40">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-2">
                    Awaiting Admin Direct Message & Level Evaluation
                  </div>
                  <h3 className="text-2xl font-bold text-white">Application Under Review</h3>
                  <p className="text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
                    An Administrator is reviewing your past experience on <span className="text-white font-semibold">{latestSub?.workedApp || user?.workedApp || 'your app'}</span> and will message your ID <span className="font-mono text-purple-300 font-semibold">({latestSub?.workedAppId || user?.workedAppId || user?.platformId})</span> to confirm you are the real user, then assign your official <strong className="text-amber-300">Level A, B, C, or D</strong> rating.
                  </p>

                  {/* Submission Details Recap */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-4 text-xs">
                    <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-gray-300">
                      App: <strong className="text-white">{latestSub?.workedApp || user?.workedApp || 'Submitted'}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-gray-300 font-mono">
                      App ID: <strong className="text-purple-300">{latestSub?.workedAppId || user?.workedAppId || user?.platformId || 'Pending'}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-gray-300">
                      Agency Center: <strong className="text-white">{latestSub?.agencyCenter || user?.agencyCenter || 'Pending'}</strong>
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-pink-950/50 border border-pink-500/30 text-pink-300 font-semibold">
                      Super Level: {latestSub?.superLevel || user?.superLevel || 'Super Level 1'}
                    </span>
                  </div>

                  {latestSub?.pastExperience && (
                    <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/10 text-xs text-gray-300">
                      <span className="text-gray-400 font-semibold block mb-0.5">Submitted Past Experience:</span>
                      <p className="italic text-gray-200">"{latestSub.pastExperience}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Direct Message Alert */}
              {latestSub?.adminDirectMessage ? (
                <div className="w-full md:w-80 p-4 rounded-2xl bg-purple-950/80 border border-purple-500/50 shadow-xl shadow-purple-950/50">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold mb-1.5">
                    <MessageSquare className="w-4 h-4 text-pink-400" />
                    Admin Message Sent to Your ID!
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white italic mb-2">
                    "{latestSub.adminDirectMessage}"
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Sent {latestSub.adminMessageSentAt ? new Date(latestSub.adminMessageSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}. Please check your platform inbox and reply to confirm you are the real user!
                  </p>
                </div>
              ) : (
                <div className="w-full md:w-80 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-400">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                    <Info className="w-4 h-4" /> What to expect next
                  </div>
                  <p className="leading-relaxed">
                    Watch for a direct message on {latestSub?.workedApp || 'your app'} (ID: {latestSub?.workedAppId || user?.workedAppId}) from Party Hub Admin. Once verified, the Admin will award your Level A, B, C, or D rating!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'REJECTED' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-rose-950/10 to-transparent shadow-2xl shadow-rose-950/40">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Status: Rejected</span>
                <h3 className="text-2xl font-bold text-white mt-1">Verification Could Not Be Confirmed</h3>
                <p className="text-sm text-gray-300 mt-1">
                  Reason:{' '}
                  <span className="text-rose-300 font-semibold">
                    {submissions[0]?.rejectionReason || 'The shared ID did not respond to admin verification or Agency Center credentials did not match.'}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  You can update your Worked App, ID, and Agency Center below to submit a new verification review.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'UNSUBMITTED' && (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-purple-500/40 bg-gradient-to-br from-purple-950/40 via-purple-950/10 to-transparent shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Action Required</span>
                <h3 className="text-2xl font-bold text-white mt-1">Apply for Verification & Experience Level Rating</h3>
                <p className="text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
                  Mention the app you worked on, your ID on that app, your Agency Center, and past experience. The admin will message you directly to confirm real identity and rate you as <span className="text-amber-300 font-bold">Level A, B, C, or D</span>!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Form */}
        <div className="lg:col-span-2">
          {status !== 'APPROVED' ? (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                {status === 'PENDING' ? 'Update Verification Details' : 'Agent Verification Application'}
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                All information is securely reviewed by Platform Admins to authenticate you and assign your official Level A/B/C/D rating.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Which App Worked On & Quick Suggestions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    Which App Have You Worked On? <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={workedApp}
                    onChange={(e) => setWorkedApp(e.target.value)}
                    placeholder="e.g. Poppo Live, Bigo Live, Chamet, TikTok Live..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-gray-400 mr-1">Popular apps:</span>
                    {POPULAR_APPS.map((app) => (
                      <button
                        type="button"
                        key={app}
                        onClick={() => setWorkedApp(app)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          workedApp.toLowerCase() === app.toLowerCase()
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:border-purple-500/50 hover:text-white'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Account ID on That App */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                    <Hash className="w-4 h-4 text-purple-400" />
                    Your ID on That App <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={workedAppId}
                    onChange={(e) => setWorkedAppId(e.target.value)}
                    placeholder="e.g. 9841205 or host_sarah_vip"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    The exact account ID or username where the Admin will direct-message you to verify that you are the real owner.
                  </p>
                </div>

                {/* 3. Agency Center & Super Level Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      Agency Center Name / Code <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={agencyCenter}
                      onChange={(e) => setAgencyCenter(e.target.value)}
                      placeholder="e.g. Star Prime Agency #88"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-pink-400" />
                      Super Level / Current Tier <span className="text-pink-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={superLevel}
                      onChange={(e) => setSuperLevel(e.target.value)}
                      placeholder="e.g. Super Level 10 (Diamond Host)"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 4. Past Experience (Used to decide Level A, B, C, D) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Past Experience & Achievements
                    </label>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      Decides Your Level A, B, C, D
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={pastExperience}
                    onChange={(e) => setPastExperience(e.target.value)}
                    placeholder="Describe your past live-streaming/agency track record: e.g. 2 years active host on Poppo Live with 1M+ monthly beans/diamonds, managed 25 sub-hosts, previous top-agency ranking, monthly GMV..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Admins evaluate your past experience to award Level A (Elite Master), Level B (Senior Pro), Level C (Intermediate), or Level D (Rising Host).
                  </p>
                </div>

                {/* 5. Notes / Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    Additional Verification Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Best time to reach me on my app ID, or additional agency reference code..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                  />
                </div>

                {/* 6. Optional Proof Screenshot */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-purple-400" />
                    App Profile / Agency Center Screenshot (Optional)
                  </label>
                  <div className="border-2 border-dashed border-white/15 hover:border-purple-500/50 rounded-2xl p-6 text-center transition-colors bg-black/20">
                    <input
                      type="file"
                      id="screenshot-input"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="screenshot-input" className="cursor-pointer flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2 hover:scale-105 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {selectedFile ? selectedFile.name : 'Attach app profile / host dashboard screenshot'}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1">PNG, JPG, or WEBP up to 10MB</span>
                    </label>
                  </div>

                  {/* Preview */}
                  {previewUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/15 bg-black/40 p-2">
                      <p className="text-xs text-gray-400 mb-2 font-medium">Selected Screenshot Preview:</p>
                      <img
                        src={previewUrl}
                        alt="Verification Preview"
                        className="max-h-48 rounded-lg mx-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading || !workedApp.trim() || !workedAppId.trim() || !agencyCenter.trim()}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 shadow-xl shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <span>Submitting Details...</span>
                  ) : (
                    <>
                      <span>Submit for Admin Verification & Level Rating</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 border-white/10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Identity Fully Verified</h3>
              <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                Your ID has been authenticated by Platform Admins. Your verified Agency Center and official {user?.experienceLevel || 'Level Rating'} are active.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar: Guidelines & Level Tiers */}
        <div className="space-y-6">
          {/* Level Rating Tiers Guide */}
          <div className="glass-panel rounded-3xl p-6 border-amber-500/30 bg-gradient-to-br from-amber-950/20 to-black/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Experience Level Tiers
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Admins evaluate your past experience to award one of four official experience tiers:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Level A — Elite Master Host</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1">
                  1M+ monthly diamonds/beans, 2+ years top track record, high GMV agency leader.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <Star className="w-3.5 h-3.5 text-pink-400" />
                  <span>Level B — Senior Pro Host</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1">
                  Consistent high performance, 1+ year live experience, proven host portfolio.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Level C — Intermediate Host</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1">
                  Active verified host with 6+ months steady streaming track record.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Level D — Rising / Entry Host</span>
                </div>
                <p className="text-[11px] text-gray-300 mt-1">
                  Emerging live streamer or new agency account establishing initial presence.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border-white/10">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              Direct Message Verification
            </h3>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Anti-Impersonation:</strong> Admins message your app ID directly to ensure no one can falsely claim your identity or agency.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Official Rating Badge:</strong> Your assigned Level A/B/C/D badge appears on your profile and directory cards.
                </span>
              </li>
            </ul>
          </div>

          {/* Submission History */}
          {submissions.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border-white/10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Submission History
              </h3>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {sub.workedApp || 'App'}: <span className="font-mono text-purple-300">{sub.workedAppId || sub.platformId || 'N/A'}</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                            : sub.status === 'PENDING'
                            ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                            : 'bg-rose-950/60 border border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center justify-between">
                      <span>Agency: {sub.agencyCenter || 'None'}</span>
                      {sub.experienceLevel ? (
                        <span className="text-amber-400 font-bold">{sub.experienceLevel}</span>
                      ) : (
                        <span className="text-pink-300 font-medium">{sub.superLevel || 'Standard'}</span>
                      )}
                    </div>

                    {sub.screenshotPath && (
                      <div className="pt-1">
                        <a
                          href={`/api/verification/image/${sub.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium underline"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Screenshot
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

