import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { AgentListItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Users, UserPlus, UserCheck, ShieldCheck, Search, MessageSquare, Sparkles, Building2, Award } from 'lucide-react';

export const AgentsList: React.FC = () => {
  const { user, hasActiveSubscription } = useAuth();
  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchAgents = async () => {
    try {
      const res = await api.get('/agents');
      setAgents(res.data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleFollowToggle = async (agentId: string) => {
    if (togglingId) return;
    setTogglingId(agentId);

    try {
      const res = await api.post(`/agents/${agentId}/follow`);
      const { isFollowing } = res.data;

      setAgents(prev =>
        prev.map(agent => {
          if (agent.id === agentId) {
            return {
              ...agent,
              isFollowing,
              followersCount: isFollowing ? agent.followersCount + 1 : Math.max(0, agent.followersCount - 1),
            };
          }
          return agent;
        })
      );
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = agents.filter(a =>
    a.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (a.bio && a.bio.toLowerCase().includes(search.toLowerCase()))
  );

  const isAgentPremium = hasActiveSubscription('AGENT_PREMIUM') && user?.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Agent Directory
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Agent Network</h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect with digital talent agents and entertainment managers.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name or bio..."
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-gray-400">Loading agents directory...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border-white/10">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No agents found</h3>
          <p className="text-sm text-gray-400 mt-1">Try another search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((agent) => (
            <div
              key={agent.id}
              className="glass-panel rounded-2xl p-5 border-white/10 flex flex-col justify-between hover:border-purple-500/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center text-white font-bold text-base shadow-md">
                      {agent.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base hover:text-purple-300 transition-colors">
                          <Link to={`/agents/${agent.id}`}>{agent.fullName}</Link>
                        </h3>
                        {agent.verificationStatus === 'APPROVED' && (
                          <span title="Verified Agent">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {agent.followersCount} followers • {agent.followingCount} following
                      </div>

                      {/* Super Level & Agency Center tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {agent.superLevel && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/30 text-pink-300 font-semibold text-[10px]">
                            <Award className="w-3 h-3 text-pink-400" />
                            {agent.superLevel}
                          </span>
                        )}
                        {agent.agencyCenter && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/20 text-purple-300 text-[10px]">
                            <Building2 className="w-3 h-3 text-purple-400" />
                            {agent.agencyCenter}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Follow Button (Agents only, not on self) */}
                  {user?.role === 'AGENT' && !agent.isSelf && (
                    <button
                      onClick={() => handleFollowToggle(agent.id)}
                      disabled={togglingId === agent.id}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        agent.isFollowing
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30'
                          : 'bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/20'
                      }`}
                    >
                      {agent.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                  {agent.bio || 'Digital talent agent on Party Hub promotional platform.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                <Link
                  to={`/agents/${agent.id}`}
                  className="text-purple-400 hover:text-purple-300 font-bold"
                >
                  View Profile →
                </Link>

                {user?.role === 'AGENT' && !agent.isSelf && (
                  <Link
                    to={`/messages?user=${agent.id}`}
                    className={`flex items-center gap-1 font-semibold ${
                      isAgentPremium ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-500'
                    }`}
                    title={isAgentPremium ? 'Direct Message' : 'Upgrade to Agent Premium to message'}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
