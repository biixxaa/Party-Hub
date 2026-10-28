import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { ConversationItem, MessageItem } from '../types';
import { CheckoutModal } from '../components/CheckoutModal';
import { checkProhibitedContact } from '../utils/prohibitedValidator';
import {
  MessageSquare,
  Send,
  Lock,
  Crown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const MessagingPage: React.FC = () => {
  const { user, hasActiveSubscription, refreshUser } = useAuth();
  const location = useLocation();

  // Selected recipient from URL query e.g. /messages?user=<id>
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('user');

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(targetUserId);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activePartner, setActivePartner] = useState<{ id: string; fullName: string; email: string } | null>(null);

  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isVerified = user?.verificationStatus === 'APPROVED';
  const isAgent = user?.role === 'AGENT';
  const isPremium = hasActiveSubscription('AGENT_PREMIUM');
  const isEligible = isAgent && isVerified && isPremium;

  // Real-time prohibited content validator
  const prohibitedCheck = checkProhibitedContact(newMessage);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!isEligible) return;
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch thread messages
  const fetchThread = async (userId: string) => {
    setIsLoadingMessages(true);
    setError(null);
    try {
      const res = await api.get(`/messages/${userId}`);
      setMessages(res.data.messages || []);
      setActivePartner(res.data.otherUser);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load conversation thread.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isEligible) {
      fetchConversations();
    }
  }, [isEligible]);

  useEffect(() => {
    if (selectedUserId && isEligible) {
      fetchThread(selectedUserId);
    }
  }, [selectedUserId, isEligible]);

  // Polling for live chat updates
  useEffect(() => {
    if (!selectedUserId || !isEligible) return;
    const interval = setInterval(() => {
      fetchThread(selectedUserId);
      fetchConversations();
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedUserId, isEligible]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    if (prohibitedCheck.isBlocked) {
      setError(prohibitedCheck.reason || 'Prohibited contact information detected.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const res = await api.post(`/messages/${selectedUserId}`, {
        content: newMessage,
      });

      setMessages(prev => [
        ...prev,
        {
          id: res.data.data.id,
          senderId: user!.id,
          receiverId: selectedUserId,
          content: newMessage,
          isRead: false,
          isSelf: true,
          createdAt: res.data.data.createdAt,
        },
      ]);

      setNewMessage('');
      fetchConversations();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Non-eligible Screen Guard
  if (!isEligible) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border-purple-500/30 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-purple-950/50">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Private Messaging Restricted
          </h2>
          <p className="text-sm text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
            Private direct messaging is exclusively accessible to verified Agents with an active{' '}
            <span className="text-amber-300 font-bold">Agent Premium ($50/week)</span> subscription.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isVerified && (
              <Link
                to="/verification"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Identity First</span>
              </Link>
            )}

            {isVerified && !isPremium && (
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="px-6 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                <span>Activate Agent Premium ($50/wk)</span>
              </button>
            )}
          </div>
        </div>

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
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Messaging Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> VIP Agent Direct Messaging
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Private Conversations</h1>
        </div>

        <Link
          to="/agents"
          className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
        >
          Find Agents to Message →
        </Link>
      </div>

      {/* Safety Notice Banner (Section 7) */}
      <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span>
          Compliance Notice: WhatsApp numbers/links and Telegram handles are strictly prohibited in messages.
        </span>
      </div>

      {/* Chat Window */}
      <div className="glass-panel rounded-3xl border-white/10 overflow-hidden shadow-2xl h-[650px] flex">
        {/* Left Sidebar: Conversations List */}
        <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
          <div className="p-4 border-b border-white/10 font-bold text-sm text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Direct Inboxes</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading messages...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                <p>No active conversations yet.</p>
                <Link to="/agents" className="text-purple-400 underline font-bold mt-2 block">
                  Browse Agent Directory
                </Link>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.otherUser.id}
                  onClick={() => setSelectedUserId(c.otherUser.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                    selectedUserId === c.otherUser.id
                      ? 'bg-purple-600/20 border-l-4 border-purple-500'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0">
                    {c.otherUser.fullName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {c.otherUser.fullName}
                      </h4>
                      {c.unreadCount > 0 && (
                        <span className="text-[10px] bg-purple-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className="flex-1 flex flex-col bg-black/40">
          {selectedUserId && activePartner ? (
            <>
              {/* Partner Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
                    {activePartner.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                      {activePartner.fullName}
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </h3>
                    <p className="text-[11px] text-gray-400">{activePartner.email}</p>
                  </div>
                </div>

                <Link
                  to={`/agents/${activePartner.id}`}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                >
                  View Profile
                </Link>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {isLoadingMessages ? (
                  <div className="py-20 text-center text-xs text-gray-400">Loading thread...</div>
                ) : messages.length === 0 ? (
                  <div className="py-20 text-center text-xs text-gray-400">
                    Say hello to {activePartner.fullName} to start the collaboration.
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.isSelf
                            ? 'bg-purple-600 text-white rounded-br-sm shadow-md shadow-purple-600/20'
                            : 'bg-white/10 text-gray-100 rounded-bl-sm border border-white/5'
                        }`}
                      >
                        <p className="leading-relaxed break-words">{msg.content}</p>
                        <div
                          className={`text-[10px] mt-1 text-right ${
                            msg.isSelf ? 'text-purple-200' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error Banner */}
              {error && (
                <div className="px-4 py-2 bg-red-950/80 border-t border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Live Prohibited Warning */}
              {prohibitedCheck.isBlocked && (
                <div className="px-4 py-2 bg-red-950/80 border-t border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{prohibitedCheck.reason}</span>
                </div>
              )}

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/30">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message (WhatsApp & Telegram links prohibited)..."
                    className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim() || prohibitedCheck.isBlocked}
                    className="p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Send Message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mb-3 opacity-40 text-purple-400" />
              <p className="text-sm font-semibold text-gray-400">Select an agent to view conversation</p>
              <p className="text-xs text-gray-500 mt-1">Or choose an agent from the Agent Directory</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
