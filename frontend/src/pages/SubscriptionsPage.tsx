import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CheckoutModal } from '../components/CheckoutModal';
import { PaymentRecord } from '../types';
import {
  CreditCard,
  Crown,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  QrCode,
} from 'lucide-react';

export const SubscriptionsPage: React.FC = () => {
  const { user, hasActiveSubscription, refreshUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);

  // Modal checkout
  const [checkoutType, setCheckoutType] = useState<'AGENT_PREMIUM' | 'CREATOR_PREMIUM' | null>(null);

  const isAgent = user?.role === 'AGENT';
  const isCreator = user?.role === 'PLATFORM_CREATOR';
  const isVerified = user?.verificationStatus === 'APPROVED';

  const isAgentPremium = hasActiveSubscription('AGENT_PREMIUM');
  const isCreatorPremium = hasActiveSubscription('CREATOR_PREMIUM');

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments/history');
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error('Failed to load payments history:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
          <CreditCard className="w-3.5 h-3.5" />
          Transparent Platform Pricing
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Subscriptions & Paid Boosting
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Unlock high-impact promotional capabilities with verified payment protection.
        </p>
      </div>

      {/* Verification Warning (if unverified) */}
      {!isVerified && (
        <div className="mb-8 p-4 rounded-2xl glass-panel border-amber-500/40 bg-amber-950/20 text-amber-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              Identity verification approval is required before activating premium subscriptions or paid boosts.
            </span>
          </div>
          <a
            href="/verification"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
          >
            Verify Now
          </a>
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Plan 1: Agent Premium */}
        <div
          className={`relative glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all ${
            isAgentPremium
              ? 'border-emerald-500/50 shadow-2xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
              : 'border-white/10 hover:border-purple-500/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-500/30">
                For Agents
              </span>
              {isAgentPremium && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Agent Premium</h3>
            <p className="text-xs text-gray-400 mb-6">
              Unlock private networking with verified agents and top digital managers.
            </p>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-extrabold text-white">$50</span>
              <span className="text-gray-400 text-xs font-semibold">USD / week</span>
            </div>

            {/* Accepted Methods */}
            <div className="flex flex-wrap items-center gap-1.5 mb-6">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                <Smartphone className="w-3 h-3 text-emerald-400" /> Chapa (Telebirr & CBE)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                <CreditCard className="w-3 h-3 text-purple-400" /> Cards
              </span>
            </div>

            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Unlimited direct private messaging</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Verified talent representation badge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Follow unlimited digital talent agents</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Prioritized support response</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setCheckoutType('AGENT_PREMIUM')}
            disabled={!isAgent || isAgentPremium || !isVerified}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              isAgentPremium
                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isAgentPremium ? (
              <span>Currently Active</span>
            ) : !isAgent ? (
              <span>Agent Role Required</span>
            ) : !isVerified ? (
              <span>Verification Required</span>
            ) : (
              <span>Subscribe for $50/wk</span>
            )}
          </button>
        </div>

        {/* Plan 2: Creator Premium */}
        <div
          className={`relative glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all ${
            isCreatorPremium
              ? 'border-emerald-500/50 shadow-2xl shadow-emerald-950/30 ring-1 ring-emerald-500/30'
              : 'border-pink-500/40 shadow-xl shadow-pink-950/20'
          }`}
        >
          <div className="absolute -top-3 right-6 bg-gradient-to-r from-pink-600 to-amber-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full shadow-md">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-950/60 px-2.5 py-1 rounded-full border border-pink-500/30">
                For Platform Creators
              </span>
              {isCreatorPremium && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Creator Premium</h3>
            <p className="text-xs text-gray-400 mb-6">
              Publish campaigns, monitor impressions, and see which Agents liked your platform.
            </p>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-4xl font-extrabold text-white">$100</span>
              <span className="text-gray-400 text-xs font-semibold">USD / week</span>
            </div>

            {/* Accepted Methods */}
            <div className="flex flex-wrap items-center gap-1.5 mb-6">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                <Smartphone className="w-3 h-3 text-emerald-400" /> Chapa (Telebirr & CBE)
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300">
                <CreditCard className="w-3 h-3 text-pink-400" /> Cards
              </span>
            </div>

            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Publish unlimited promotional posts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Full engagement stats (views & impressions)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>See which Agents liked your posts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Eligibility for paid 24-hour post boosts</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setCheckoutType('CREATOR_PREMIUM')}
            disabled={!isCreator || isCreatorPremium || !isVerified}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              isCreatorPremium
                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-gradient-to-r from-pink-600 via-purple-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white shadow-lg shadow-pink-600/30 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isCreatorPremium ? (
              <span>Currently Active</span>
            ) : !isCreator ? (
              <span>Creator Role Required</span>
            ) : !isVerified ? (
              <span>Verification Required</span>
            ) : (
              <span>Subscribe for $100/wk</span>
            )}
          </button>
        </div>

        {/* Plan 3: Post Boosting */}
        <div className="relative glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between border border-amber-500/30 shadow-xl shadow-amber-950/20">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/30">
                A La Carte Boost
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">Paid Post Boosting</h3>
            <p className="text-xs text-gray-400 mb-6">
              Give any individual promotional campaign maximum visibility on the feed.
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">$50</span>
              <span className="text-gray-400 text-xs font-semibold">USD / 24 hours</span>
            </div>

            <ul className="space-y-3 text-xs text-gray-300 mb-8">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Pinned to top of promotional feed</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Distinctive glowing "Sponsored" badge</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Exactly 24 hours from payment confirmation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Boost individual posts from Creator Console</span>
              </li>
            </ul>
          </div>

          <a
            href="/creator/posts"
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Boost Posts in Console</span>
          </a>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Receipt className="w-5 h-5 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Verified Transaction History</h2>
        </div>

        {isLoadingPayments ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading transactions...</div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No payments on record for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-gray-400 border-b border-white/10">
                <tr>
                  <th className="pb-3 font-semibold">Transaction ID</th>
                  <th className="pb-3 font-semibold">Purpose</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payment Method</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 font-mono text-purple-300">{p.transactionId}</td>
                    <td className="py-3 font-semibold text-white capitalize">
                      {p.purpose.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 font-bold text-white">
                      ${p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="py-3 text-gray-300">{p.paymentMethod}</td>
                    <td className="py-3 text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                          p.status === 'COMPLETED'
                            ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400'
                            : 'bg-red-950/60 border border-red-500/30 text-red-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutType && (
        <CheckoutModal
          isOpen={true}
          onClose={() => setCheckoutType(null)}
          type={checkoutType}
          onSuccess={() => {
            refreshUser();
            fetchPayments();
          }}
        />
      )}
    </div>
  );
};
