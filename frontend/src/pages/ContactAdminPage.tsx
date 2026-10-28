import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ContactTicket } from '../types';
import { checkProhibitedContact } from '../utils/prohibitedValidator';
import {
  Headphones,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';

export const ContactAdminPage: React.FC = () => {
  const [tickets, setTickets] = useState<ContactTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Prohibited contact checks
  const subCheck = checkProhibitedContact(subject);
  const msgCheck = checkProhibitedContact(message);
  const prohibitedWarning = subCheck.isBlocked
    ? subCheck.reason
    : msgCheck.isBlocked
    ? msgCheck.reason
    : null;

  const fetchTickets = async () => {
    try {
      const res = await api.get('/contact-admin/my-tickets');
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prohibitedWarning) {
      setError(prohibitedWarning);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.post('/contact-admin', { subject, message });
      setSuccess(res.data.message || 'Ticket submitted successfully.');
      setSubject('');
      setMessage('');
      fetchTickets();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit contact request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
          <Headphones className="w-3.5 h-3.5" />
          Direct Admin Support
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Contact Administration</h1>
        <p className="text-sm text-gray-400 mt-1">
          Have an inquiry regarding verification, billing, or platform policies? Message the moderation team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Submit Ticket Form */}
        <div className="md:col-span-3">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              <span>Submit Support Inquiry</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Our administrative staff reviews requests and responds directly in your dashboard.
            </p>

            {/* Prohibited Alert */}
            <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                Safety Rule: WhatsApp numbers/links and Telegram usernames/links are strictly prohibited.
              </span>
            </div>

            {prohibitedWarning && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{prohibitedWarning}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question regarding verification turnaround"
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Message</label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide full details of your question or issue..."
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !!prohibitedWarning}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting Ticket...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message to Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Previous Inquiries Sidebar */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
            Your Support Inquiries
          </h3>

          {isLoading ? (
            <div className="text-xs text-gray-400 py-6 text-center">Loading past tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="glass-panel rounded-2xl p-6 text-center border-white/10 text-xs text-gray-400">
              No previous inquiries submitted.
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="glass-panel rounded-2xl p-4 border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                          : 'bg-amber-950/60 border border-amber-500/30 text-amber-400'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">{t.subject}</h4>
                  <p className="text-gray-300 leading-relaxed">{t.message}</p>

                  {/* Admin Reply */}
                  {t.adminReply && (
                    <div className="mt-3 pt-2.5 border-t border-white/10 bg-purple-950/30 rounded-xl p-3 border border-purple-800/30">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Admin Reply ({t.repliedAt ? new Date(t.repliedAt).toLocaleDateString() : 'Recent'})
                      </div>
                      <p className="text-white text-xs leading-relaxed">{t.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
