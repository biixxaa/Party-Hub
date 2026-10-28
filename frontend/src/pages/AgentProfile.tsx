import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Users,
  UserPlus,
  UserCheck,
  MessageSquare,
  Calendar,
  ArrowLeft,
  Sparkles,
  Building2,
  Award,
  Hash,
} from 'lucide-react';

export const AgentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasActiveSubscription } = useAuth();
  const [agent, setAgent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/agents/${id}`);
      setAgent(res.data.agent);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load agent profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!agent || isToggling) return;
    setIsToggling(true);

    try {
      const res = await api.post(`/agents/${agent.id}/follow`);
      const { isFollowing } = res.data;
      setAgent((prev: any) => ({
        ...prev,
        isFollowing,
        followersCount: isFollowing ? prev.followersCount + 1 : Math.max(0, prev.followersCount - 1),
      }));
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const isPremiumUnlocked = hasActiveSubscription('AGENT_PREMIUM') && user?.verificationStatus === 'APPROVED';

  if (isLoading) {
    return <div className="py-24 text-center text-sm text-gray-400">Loading agent profile...</div>;
  }

  if (error || !agent) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="glass-panel rounded-2xl p-8 border-red-500/30">
          <p className="text-red-400 text-sm mb-4">{error || 'Agent not found.'}</p>
          <Link to="/agents" className="text-xs font-bold text-purple-400 underline">
            ← Back to Agent Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <Link
        to="/agents"
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Agent Directory</span>
      </Link>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-purple-700 via-pink-700 to-amber-600 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-purple-950/50 flex-shrink-0">
            {agent.fullName.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{agent.fullName}</span>
                  {agent.verificationStatus === 'APPROVED' && (
                    <span title="Verified Identity">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </span>
                  )}
                </h1>
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider mt-0.5">
                  Talent & Promotion Agent
                </p>

                {/* Verified Super Level & Agency Center Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2.5">
                  {agent.superLevel && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-950/70 border border-pink-500/40 text-pink-300 font-bold text-xs shadow-sm">
                      <Award className="w-3.5 h-3.5 text-pink-400" />
                      {agent.superLevel}
                    </span>
                  )}
                  {agent.agencyCenter && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 font-medium text-xs">
                      <Building2 className="w-3.5 h-3.5 text-purple-400" />
                      {agent.agencyCenter}
                    </span>
                  )}
                  {agent.platformId && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 font-mono text-[11px]">
                      <Hash className="w-3 h-3 text-emerald-400" />
                      ID: {agent.platformId}
                    </span>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              {user?.role === 'AGENT' && !agent.isSelf && (
                <button
                  onClick={handleFollow}
                  disabled={isToggling}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-center sm:self-auto ${
                    agent.isFollowing
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
                      : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/25'
                  }`}
                >
                  {agent.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow Agent</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center sm:justify-start gap-6 my-4 text-xs">
              <div>
                <span className="font-bold text-white text-base">{agent.followersCount}</span>{' '}
                <span className="text-gray-400">Followers</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <div>
                <span className="font-bold text-white text-base">{agent.followingCount}</span>{' '}
                <span className="text-gray-400">Following</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-600" />
              <div className="flex items-center gap-1 text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-black/30 rounded-2xl p-4 border border-white/5 my-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                About & Representation
              </h4>
              <p className="text-sm text-gray-200 leading-relaxed">
                {agent.bio || 'This agent has not added a detailed bio yet.'}
              </p>
            </div>

            {/* Message Action */}
            {user?.role === 'AGENT' && !agent.isSelf && (
              <div className="pt-2">
                {isPremiumUnlocked ? (
                  <Link
                    to={`/messages?user=${agent.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send Private Message</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Private messaging requires approved verification and active{' '}
                      <Link to="/subscriptions" className="font-bold underline text-amber-200">
                        Agent Premium ($50/wk)
                      </Link>
                      .
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
