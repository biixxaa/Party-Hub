import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  QrCode,
} from 'lucide-react';

export const CHAPA_PAYMENT_URL = 'https://qr.chapa.global/test/payment-preview/payment-link/m6c7yeUA7Y';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'AGENT_PREMIUM' | 'CREATOR_PREMIUM' | 'POST_BOOST';
  postId?: string; // required for post boost
  postTitle?: string;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  type,
  postId,
  postTitle,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'CHAPA' | 'CARD'>('CHAPA');

  // Chapa state
  const [chapaReference, setChapaReference] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Card state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvv, setCvv] = useState('888');
  const [cardholderName, setCardholderName] = useState('Verified Subscriber');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(CHAPA_PAYMENT_URL);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const getProductDetails = () => {
    switch (type) {
      case 'AGENT_PREMIUM':
        return {
          title: 'Agent Premium Subscription',
          price: 50.0,
          period: 'per week',
          perks: [
            'Unlock private direct messaging with other Agents',
            'Full profile visibility across the platform',
            'Priority verified talent badge',
            'Weekly recurring billing cycle',
          ],
        };
      case 'CREATOR_PREMIUM':
        return {
          title: 'Platform Creator Premium',
          price: 100.0,
          period: 'per week',
          perks: [
            'Create & manage unlimited promotional posts',
            'Access detailed engagement statistics (views, impressions)',
            'See the full list of Agents who liked your posts',
            'Weekly recurring billing cycle',
          ],
        };
      case 'POST_BOOST':
        return {
          title: `Boost: ${postTitle || 'Promotional Post'}`,
          price: 50.0,
          period: 'for 24 hours',
          perks: [
            'Prominent top-of-feed placement',
            'Glowing "Sponsored" badge for 24 hours',
            'Up to 10x higher engagement and click rates',
            'Automatic expiration after 24 hours',
          ],
        };
    }
  };

  const product = getProductDetails();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const paymentDetails =
      paymentMethod === 'CHAPA'
        ? {
            chapaReference: chapaReference.trim() || undefined,
            paymentMethod: 'Chapa',
          }
        : {
            cardNumber,
            expDate,
            cvv,
            cardholderName,
          };

    try {
      let endpoint = '';
      let payload: any = {
        paymentMethod,
        paymentDetails,
      };

      if (type === 'AGENT_PREMIUM') {
        endpoint = '/payments/subscribe/agent';
      } else if (type === 'CREATOR_PREMIUM') {
        endpoint = '/payments/subscribe/creator';
      } else if (type === 'POST_BOOST') {
        endpoint = '/payments/boost/post';
        payload.postId = postId;
      }

      const res = await api.post(endpoint, payload);
      setSuccessMessage(res.data.message || 'Payment successfully processed!');

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      await refreshUser();
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMessage(null);
      }, 1800);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          (paymentMethod === 'CHAPA'
            ? 'Chapa payment confirmation failed. Please check your transaction details.'
            : 'Payment processing failed. Please verify card details.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl shadow-purple-950/50 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">{product.title}</h3>
          <div className="mt-2 flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold text-white">${product.price}</span>
            <span className="text-gray-400 text-sm font-medium">USD {product.period}</span>
          </div>
        </div>

        {/* Perks list */}
        <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4 mb-5">
          <p className="text-xs uppercase tracking-wider text-purple-300 font-bold mb-2">Included Features:</p>
          <ul className="space-y-1.5 text-xs text-gray-300">
            {product.perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-300">Choose Payment Method</label>
            {type === 'AGENT_PREMIUM' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Telebirr / CBE Supported
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setPaymentMethod('CHAPA')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                paymentMethod === 'CHAPA'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/50 border border-emerald-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-300 flex-shrink-0" />
              <div className="text-left">
                <div className="leading-tight">Chapa Pay</div>
                <div className="text-[10px] opacity-80 font-normal">Telebirr • CBE • QR</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                paymentMethod === 'CARD'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50 border border-purple-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-4 h-4 text-purple-300 flex-shrink-0" />
              <div className="text-left">
                <div className="leading-tight">Card Payment</div>
                <div className="text-[10px] opacity-80 font-normal">Visa • Mastercard</div>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleCheckout} className="space-y-4">
          {paymentMethod === 'CHAPA' ? (
            <div className="space-y-3.5">
              {/* Chapa Payment Info Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-teal-950/20 to-purple-950/30 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <QrCode className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-white">Chapa Secure Checkout</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-semibold">
                    Instant Activation
                  </span>
                </div>

                <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                  Pay securely using <strong className="text-emerald-300">Telebirr</strong>,{' '}
                  <strong className="text-emerald-300">CBEBirr</strong>, Commercial Bank of Ethiopia (CBE),
                  local debit cards, or QR code scan.
                </p>

                {/* Step 1: Open Link */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center gap-2">
                  <a
                    href={CHAPA_PAYMENT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Chapa Payment Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full sm:w-auto py-2.5 px-3 rounded-xl text-xs font-semibold text-emerald-200 hover:text-white bg-black/40 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors flex items-center justify-center gap-1.5"
                    title="Copy direct payment link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Confirmation / Reference */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Transaction Reference / Receipt Code (Optional)
                </label>
                <input
                  type="text"
                  value={chapaReference}
                  onChange={(e) => setChapaReference(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="e.g. CHAPA-m6c7yeUA7Y or receipt number"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Complete your payment on Chapa, then click the confirm button below to activate your membership.
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected by Chapa 256-bit secure gateway & automated verification.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!successMessage}
                className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 text-black">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Verifying Chapa Payment...
                  </span>
                ) : successMessage ? (
                  <span className="flex items-center gap-2 text-black font-extrabold">
                    <CheckCircle2 className="w-4 h-4" /> Membership Activated!
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-black font-extrabold">
                    <ShieldCheck className="w-4 h-4" />
                    Confirm & Activate Membership (${product.price} USD)
                  </span>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Alex Rivera"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="4242 4242 4242 4242"
                  />
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Expiration (MM/YY)</label>
                  <input
                    type="text"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="12/28"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">CVC / CVV</label>
                  <input
                    type="text"
                    required
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500 font-mono"
                    placeholder="888"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-bit SSL encrypted transaction verification.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !!successMessage}
                className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Transaction...
                  </span>
                ) : successMessage ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Activated!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Confirm & Pay ${product.price} USD
                  </span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};