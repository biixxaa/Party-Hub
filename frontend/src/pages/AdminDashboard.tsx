import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  AdminStats,
  VerificationSubmission,
  User,
  Post,
  Subscription,
  PaymentRecord,
  ContactTicket,
} from '../types';
import {
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Megaphone,
  CreditCard,
  Flame,
  Headphones,
  DollarSign,
  Clock,
  Trash2,
  Send,
  MessageCircle,
  Sparkles,
  ExternalLink,
  Building2,
  Award,
  Hash,
  Copy,
  Check,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'verifications' | 'users' | 'posts' | 'boosts' | 'subscriptions' | 'tickets'
  >('verifications');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [verifications, setVerifications] = useState<VerificationSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [boosts, setBoosts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tickets, setTickets] = useState<ContactTicket[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [reviewReason, setReviewReason] = useState('');
  const [rejectModalSub, setRejectModalSub] = useState<VerificationSubmission | null>(null);
  const [directMessageModalSub, setDirectMessageModalSub] = useState<VerificationSubmission | null>(null);
  const [adminDirectMsgText, setAdminDirectMsgText] = useState('');
  const [editSuperLevel, setEditSuperLevel] = useState('');
  const [editAgencyCenter, setEditAgencyCenter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyTicketModal, setReplyTicketModal] = useState<ContactTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch admin stats
  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  // Fetch verifications
  const fetchVerifications = async () => {
    try {
      const res = await api.get('/admin/verifications');
      setVerifications(res.data.submissions || []);
    } catch (err) {
      console.error('Fetch verifications error:', err);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await api.get('/admin/posts');
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
  };

  // Fetch boosts
  const fetchBoosts = async () => {
    try {
      const res = await api.get('/admin/boosts');
      setBoosts(res.data.boosts || []);
    } catch (err) {
      console.error('Fetch boosts error:', err);
    }
  };

  // Fetch subscriptions & payments
  const fetchSubscriptions = async () => {
    try {
      const [subRes, payRes] = await Promise.all([
        api.get('/admin/subscriptions'),
        api.get('/admin/payments'),
      ]);
      setSubscriptions(subRes.data.subscriptions || []);
      setPayments(payRes.data.payments || []);
    } catch (err) {
      console.error('Fetch subscriptions error:', err);
    }
  };

  // Fetch contact tickets
  const fetchTickets = async () => {
    try {
      const res = await api.get('/admin/tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Fetch tickets error:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchStats(),
        fetchVerifications(),
        fetchUsers(),
        fetchPosts(),
        fetchBoosts(),
        fetchSubscriptions(),
        fetchTickets(),
      ]);
      setIsLoading(false);
    };

    initData();
  }, []);

  // Review verification
  const handleReviewVerification = async (submissionId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setIsProcessing(true);
    try {
      await api.post(`/admin/verifications/${submissionId}/review`, {
        status,
        rejectionReason: reason,
      });

      await fetchVerifications();
      await fetchStats();
      await fetchUsers();
      setRejectModalSub(null);
      setReviewReason('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to review verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openDirectMessageModal = (sub: VerificationSubmission) => {
    setDirectMessageModalSub(sub);
    const code = Math.floor(1000 + Math.random() * 9000);
    setAdminDirectMsgText(
      sub.adminDirectMessage ||
      `Hello from Party Hub Admin. Please confirm your ownership of ID: ${sub.platformId || 'your account'} at ${sub.agencyCenter || 'your agency'}. Verification challenge code: PH-${code}.`
    );
    setEditSuperLevel(sub.superLevel || sub.user?.superLevel || 'Super Level 1');
    setEditAgencyCenter(sub.agencyCenter || sub.user?.agencyCenter || '');
  };

  const handleSendDirectMessage = async () => {
    if (!directMessageModalSub || !adminDirectMsgText.trim()) return;
    setIsProcessing(true);
    try {
      const res = await api.post(`/admin/verifications/${directMessageModalSub.id}/message`, {
        messageContent: adminDirectMsgText.trim(),
      });
      alert(res.data.message || 'Direct verification message sent.');
      await fetchVerifications();
      setDirectMessageModalSub(res.data.submission);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send direct message.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveWithSuperLevel = async () => {
    if (!directMessageModalSub) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/verifications/${directMessageModalSub.id}/review`, {
        status: 'APPROVED',
        superLevel: editSuperLevel || directMessageModalSub.superLevel,
        agencyCenter: editAgencyCenter || directMessageModalSub.agencyCenter,
        platformId: directMessageModalSub.platformId,
      });
      await fetchVerifications();
      await fetchStats();
      await fetchUsers();
      setDirectMessageModalSub(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle post publish
  const handleTogglePost = async (postId: string) => {
    try {
      await api.put(`/admin/posts/${postId}/toggle`);
      fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle post visibility.');
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/admin/posts/${postId}`);
      fetchPosts();
      fetchStats();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete post.');
    }
  };

  // Reply to ticket
  const handleReplyTicket = async () => {
    if (!replyTicketModal || !replyText.trim()) return;
    setIsProcessing(true);
    try {
      await api.post(`/admin/tickets/${replyTicketModal.id}/reply`, {
        adminReply: replyText,
      });
      await fetchTickets();
      await fetchStats();
      setReplyTicketModal(null);
      setReplyText('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reply to ticket.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Administrative Command
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Portal</h1>
          <p className="text-sm text-gray-400 mt-1">
            Moderation, verification approvals, user roles, paid boost tracking, and support desk.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <div className="glass-panel rounded-2xl p-4 border-white/10">
          <div className="text-[11px] font-semibold text-gray-400 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-white">{stats?.totalUsers ?? '...'}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {stats?.totalAgents} Agents • {stats?.totalCreators} Creators
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-amber-500/30 bg-amber-950/20">
          <div className="text-[11px] font-semibold text-amber-300 mb-1">Pending Verif.</div>
          <div className="text-2xl font-bold text-amber-400">{stats?.pendingVerifications ?? '...'}</div>
          <div className="text-[10px] text-amber-400/70 mt-0.5">Requires review</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-white/10">
          <div className="text-[11px] font-semibold text-gray-400 mb-1">Total Posts</div>
          <div className="text-2xl font-bold text-white">{stats?.totalPosts ?? '...'}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Promotional feed</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-amber-500/30">
          <div className="text-[11px] font-semibold text-amber-300 mb-1">Active Boosts</div>
          <div className="text-2xl font-bold text-amber-400">{stats?.activeBoosts ?? '...'}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">$50 / 24h promotions</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-emerald-500/30 bg-emerald-950/20">
          <div className="text-[11px] font-semibold text-emerald-300 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-emerald-400">${stats?.totalRevenue?.toFixed(0) ?? '...'}</div>
          <div className="text-[10px] text-emerald-400/70 mt-0.5">USD Verified</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-blue-500/30">
          <div className="text-[11px] font-semibold text-blue-300 mb-1">Open Tickets</div>
          <div className="text-2xl font-bold text-blue-400">{stats?.openTickets ?? '...'}</div>
          <div className="text-[10px] text-blue-400/70 mt-0.5">Inquiries</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border-purple-500/30">
          <div className="text-[11px] font-semibold text-purple-300 mb-1">Subscriptions</div>
          <div className="text-2xl font-bold text-purple-400">{subscriptions.filter(s => s.status === 'ACTIVE').length}</div>
          <div className="text-[10px] text-purple-400/70 mt-0.5">Active VIPs</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 mb-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'verifications'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Verifications ({verifications.filter(v => v.status === 'PENDING').length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manage Users ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'posts'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Moderate Posts ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('boosts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'boosts'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Paid Boosts ({boosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Subscriptions & Payments ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Support Inquiries ({tickets.filter(t => t.status === 'OPEN').length} Open)</span>
        </button>
      </div>

      {/* Tab 1: Verifications */}
      {activeTab === 'verifications' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
                First Deploy Identity Verification & Direct Admin Authentication Queue
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Inspect users' shared Platform IDs and Agency Centers, message their IDs directly to verify real ownership, and activate their Super Level.
              </p>
            </div>
            <div className="text-xs text-amber-300 font-semibold px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-500/30">
              {verifications.filter(v => v.status === 'PENDING').length} Pending Review
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">User Account</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Shared Platform ID</th>
                  <th className="pb-3 font-semibold">Agency Center</th>
                  <th className="pb-3 font-semibold">Super Level</th>
                  <th className="pb-3 font-semibold">Proof / Note</th>
                  <th className="pb-3 font-semibold">Status & Contact</th>
                  <th className="pb-3 font-semibold text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-white/5 transition-colors">
                    {/* User Account */}
                    <td className="py-3.5">
                      <div className="font-bold text-white text-sm">{v.user?.fullName}</div>
                      <div className="text-[11px] text-gray-400">{v.user?.email}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{new Date(v.createdAt).toLocaleDateString()}</div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5">
                      <span className="text-[10px] uppercase font-bold text-purple-400">
                        {v.user?.role.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Shared Platform ID */}
                    <td className="py-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-purple-500/30 font-mono text-purple-300 font-bold text-xs">
                        <Hash className="w-3.5 h-3.5 text-purple-400" />
                        <span>{v.platformId || v.user?.platformId || 'None'}</span>
                        {(v.platformId || v.user?.platformId) && (
                          <button
                            onClick={() => copyToClipboard(v.platformId || v.user?.platformId || '')}
                            className="p-0.5 hover:text-white text-gray-400 transition-colors"
                            title="Copy ID to message in platform"
                          >
                            {copiedId === (v.platformId || v.user?.platformId) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Agency Center */}
                    <td className="py-3.5">
                      <div className="text-gray-300 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span>{v.agencyCenter || v.user?.agencyCenter || 'Not Specified'}</span>
                      </div>
                    </td>

                    {/* Super Level */}
                    <td className="py-3.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 font-semibold text-[11px]">
                        <Award className="w-3.5 h-3.5 text-pink-400" />
                        <span>{v.superLevel || v.user?.superLevel || 'Super Level 1'}</span>
                      </div>
                    </td>

                    {/* Proof / Note */}
                    <td className="py-3.5">
                      {v.screenshotPath ? (
                        <a
                          href={`/api/verification/image/${v.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold underline text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Proof
                        </a>
                      ) : (
                        <span className="text-[11px] text-gray-400">ID Direct Auth</span>
                      )}
                      {v.notes && (
                        <p className="text-[10px] text-gray-400 truncate max-w-[150px] mt-0.5" title={v.notes}>
                          Note: "{v.notes}"
                        </p>
                      )}
                    </td>

                    {/* Status & Contact */}
                    <td className="py-3.5">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            v.status === 'APPROVED'
                              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                              : v.status === 'PENDING'
                              ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                              : 'bg-rose-950/60 border border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {v.status}
                        </span>

                        {v.adminDirectMessage && (
                          <div className="text-[10px] text-purple-300 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-pink-400" />
                            <span>Messaged</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Admin Actions */}
                    <td className="py-3.5 text-right">
                      {v.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDirectMessageModal(v)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1"
                            title="Message user on ID and verify real identity"
                          >
                            <Send className="w-3 h-3" />
                            Message ID & Verify
                          </button>
                          <button
                            onClick={() => handleReviewVerification(v.id, 'APPROVED')}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModalSub(v)}
                            disabled={isProcessing}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[11px] font-medium">Reviewed by {v.reviewedBy || 'Admin'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Platform Users Directory</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">Full Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Role</th>
                  <th className="pb-3 font-semibold">Shared Platform ID</th>
                  <th className="pb-3 font-semibold">Agency Center</th>
                  <th className="pb-3 font-semibold">Super Level</th>
                  <th className="pb-3 font-semibold">Verification</th>
                  <th className="pb-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-white">{u.fullName}</td>
                    <td className="py-3 text-gray-300">{u.email}</td>
                    <td className="py-3">
                      <span className="text-[10px] font-bold uppercase text-purple-400">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-purple-300">{u.platformId || '-'}</td>
                    <td className="py-3 text-gray-300">{u.agencyCenter || '-'}</td>
                    <td className="py-3">
                      {u.superLevel ? (
                        <span className="px-2 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 text-[10px] font-semibold">
                          {u.superLevel}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          u.verificationStatus === 'APPROVED'
                            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                            : u.verificationStatus === 'PENDING'
                            ? 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {u.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Post Moderation */}
      {activeTab === 'posts' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Promotional Posts Moderation</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">Platform & Title</th>
                  <th className="pb-3 font-semibold">Creator</th>
                  <th className="pb-3 font-semibold">Impressions / Likes</th>
                  <th className="pb-3 font-semibold">Boost Status</th>
                  <th className="pb-3 font-semibold">Visibility</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-white">{p.platformName}</div>
                      <div className="text-[11px] text-gray-300 truncate max-w-xs">{p.title}</div>
                    </td>
                    <td className="py-3 text-gray-300">{p.creator?.fullName}</td>
                    <td className="py-3 text-gray-300">
                      {p.viewCount} views • {p.likeCount} likes
                    </td>
                    <td className="py-3">
                      {p.isBoosted ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 fill-current" /> Sponsored
                        </span>
                      ) : (
                        <span className="text-gray-500">Standard</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          p.isPublished
                            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                            : 'bg-red-950/60 border border-red-500/30 text-red-400'
                        }`}
                      >
                        {p.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePost(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-semibold"
                        >
                          {p.isPublished ? 'Hide' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          className="p-1 text-gray-400 hover:text-red-400"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Paid Boosts */}
      {activeTab === 'boosts' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Paid 24-Hour Post Boosts ($50 USD)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">Post Title</th>
                  <th className="pb-3 font-semibold">Creator</th>
                  <th className="pb-3 font-semibold">Fee Paid</th>
                  <th className="pb-3 font-semibold">Start Time</th>
                  <th className="pb-3 font-semibold">Expiration Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {boosts.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-white">{b.post?.title}</td>
                    <td className="py-3 text-gray-300">{b.post?.creator?.fullName}</td>
                    <td className="py-3 font-bold text-amber-400">${b.pricePaid.toFixed(2)} USD</td>
                    <td className="py-3 text-gray-400">{new Date(b.startTime).toLocaleString()}</td>
                    <td className="py-3 text-gray-400">{new Date(b.expirationTime).toLocaleString()}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          b.status === 'ACTIVE'
                            ? 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Subscriptions & Payments */}
      {activeTab === 'subscriptions' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Subscription & Transaction Registry</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Plan / Type</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Start</th>
                  <th className="pb-3 font-semibold">Expires</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-bold text-white">{s.user?.fullName}</td>
                    <td className="py-3 text-purple-300 font-semibold">{s.type.replace(/_/g, ' ')}</td>
                    <td className="py-3 font-bold text-white">${s.pricePaid.toFixed(2)} USD</td>
                    <td className="py-3 text-gray-400">{new Date(s.startDate).toLocaleDateString()}</td>
                    <td className="py-3 text-gray-400">{new Date(s.expirationDate).toLocaleDateString()}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4">User Support Desk</h2>
          <div className="space-y-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === 'OPEN'
                          ? 'bg-blue-950/60 border border-blue-500/30 text-blue-400'
                          : 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-xs font-bold text-white">{t.user?.fullName}</span>
                    <span className="text-[11px] text-gray-400">({t.user?.role.replace('_', ' ')})</span>
                  </div>

                  <h4 className="font-bold text-base text-white mt-1">{t.subject}</h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-2xl">{t.message}</p>

                  {t.adminReply && (
                    <div className="mt-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-xs">
                      <span className="font-bold text-purple-300 block mb-0.5">Admin Response:</span>
                      <p className="text-gray-200">{t.adminReply}</p>
                    </div>
                  )}
                </div>

                {t.status === 'OPEN' && (
                  <button
                    onClick={() => {
                      setReplyTicketModal(t);
                      setReplyText('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all self-start"
                  >
                    Reply & Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-rose-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Reject Verification</h3>
            <p className="text-xs text-gray-400 mb-4">
              State the reason why {rejectModalSub.user?.fullName}'s screenshot does not meet platform criteria.
            </p>
            <textarea
              rows={3}
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="e.g. Screenshot does not clearly display username and creator metrics..."
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejectModalSub(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReviewVerification(rejectModalSub.id, 'REJECTED', reviewReason)}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Ticket Modal */}
      {replyTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel rounded-2xl p-6 max-w-lg w-full border border-blue-500/30">
            <h3 className="text-lg font-bold text-white mb-1">Reply to {replyTicketModal.user?.fullName}</h3>
            <p className="text-xs text-gray-400 mb-4">Subject: "{replyTicketModal.subject}"</p>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Enter official resolution or guidance for the user..."
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setReplyTicketModal(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReplyTicket}
                disabled={isProcessing || !replyText.trim()}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Send Reply & Resolve Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Message & Real User Verification Modal */}
      {directMessageModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-purple-500/40 shadow-2xl shadow-purple-950/70 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-pink-400" />
                  First Deploy Direct Authentication
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Verify Real User Identity & Super Level
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Candidate: <strong className="text-white">{directMessageModalSub.user?.fullName}</strong> ({directMessageModalSub.user?.email}) — {directMessageModalSub.user?.role.replace('_', ' ')}
                </p>
              </div>

              <button
                onClick={() => setDirectMessageModalSub(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Candidate Credentials Card */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 text-xs">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Shared Platform ID</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-purple-300">
                  <Hash className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>{directMessageModalSub.platformId || directMessageModalSub.user?.platformId || 'None'}</span>
                  {(directMessageModalSub.platformId || directMessageModalSub.user?.platformId) && (
                    <button
                      onClick={() => copyToClipboard(directMessageModalSub.platformId || directMessageModalSub.user?.platformId || '')}
                      className="p-1 rounded bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white"
                      title="Copy ID"
                    >
                      {copiedId === (directMessageModalSub.platformId || directMessageModalSub.user?.platformId) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Agency Center</span>
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="truncate">{directMessageModalSub.agencyCenter || directMessageModalSub.user?.agencyCenter || 'None'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Claimed Super Level</span>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 font-bold">
                  <Award className="w-3.5 h-3.5 text-pink-400" />
                  <span>{directMessageModalSub.superLevel || directMessageModalSub.user?.superLevel || 'Super Level 1'}</span>
                </div>
              </div>
            </div>

            {directMessageModalSub.screenshotPath && (
              <div className="mb-6 p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs">
                <span className="text-gray-300">Submitted Proof Screenshot Available:</span>
                <a
                  href={`/api/verification/image/${directMessageModalSub.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-bold underline"
                >
                  <Eye className="w-3.5 h-3.5" /> Open Screenshot
                </a>
              </div>
            )}

            {/* Step 1: Admin Direct Message on Shared ID */}
            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 to-black/30 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-500/50 flex items-center justify-center text-purple-300 font-bold text-xs">
                  1
                </span>
                <h4 className="text-sm font-bold text-white">
                  Message User on ID: <span className="font-mono text-purple-300">{directMessageModalSub.platformId || directMessageModalSub.user?.platformId}</span>
                </h4>
              </div>
              <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                Send this verification challenge to the candidate's dashboard, and copy their ID to message them on their app/platform to confirm they are the real user:
              </p>

              <textarea
                rows={3}
                value={adminDirectMsgText}
                onChange={(e) => setAdminDirectMsgText(e.target.value)}
                placeholder="Message or challenge code sent to the user's ID..."
                className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 transition-colors mb-3"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400">
                  {directMessageModalSub.adminMessageSentAt ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Messaged at {new Date(directMessageModalSub.adminMessageSentAt).toLocaleTimeString()}
                    </span>
                  ) : (
                    'Status: Not yet messaged'
                  )}
                </span>

                <button
                  onClick={handleSendDirectMessage}
                  disabled={isProcessing || !adminDirectMsgText.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Record / Update Direct Message
                </button>
              </div>
            </div>

            {/* Step 2: Confirm Super Level & Activate */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 to-black/30 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold text-xs">
                  2
                </span>
                <h4 className="text-sm font-bold text-white">Confirm Super Level & Approve Real User</h4>
              </div>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                Once the user has confirmed your message on their shared ID, verify and confirm their final Super Level rank and Agency Center:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Confirmed Agency Center
                  </label>
                  <input
                    type="text"
                    value={editAgencyCenter}
                    onChange={(e) => setEditAgencyCenter(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Agency Center name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Confirmed Super Level Rank
                  </label>
                  <input
                    type="text"
                    value={editSuperLevel}
                    onChange={(e) => setEditSuperLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Super Level 10 (Diamond Host)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setRejectModalSub(directMessageModalSub);
                    setDirectMessageModalSub(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 transition-colors"
                >
                  Reject Candidate
                </button>
                <button
                  onClick={handleApproveWithSuperLevel}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Real User & Grant Super Level
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
