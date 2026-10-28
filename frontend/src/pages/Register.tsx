import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { checkProhibitedContact } from '../utils/prohibitedValidator';
import { Sparkles, Lock, Mail, User, ShieldAlert, ArrowRight, AlertTriangle, Building2, Award, Hash } from 'lucide-react';
import { Role } from '../types';

export const Register: React.FC = () => {
  const [role, setRole] = useState<Role>('AGENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [platformId, setPlatformId] = useState('');
  const [agencyCenter, setAgencyCenter] = useState('');
  const [superLevel, setSuperLevel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Dynamic prohibited content check
  const fullNameCheck = checkProhibitedContact(fullName);
  const bioCheck = checkProhibitedContact(bio);
  const prohibitedWarning = fullNameCheck.isBlocked
    ? fullNameCheck.reason
    : bioCheck.isBlocked
    ? bioCheck.reason
    : null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (prohibitedWarning) {
      setError(prohibitedWarning);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/register', {
        role,
        fullName,
        email,
        password,
        bio,
        platformId: platformId.trim() || undefined,
        agencyCenter: agencyCenter.trim() || undefined,
        superLevel: superLevel.trim() || undefined,
      });

      login(res.data.token, res.data.user);
      navigate('/verification'); // Direct to identity verification right after registration
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl shadow-purple-950/40">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl shadow-purple-600/30 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Party Hub Account</h1>
            <p className="text-sm text-gray-400 mt-1">
              Select your role to connect, promote, or represent platforms
            </p>
          </div>

          {/* Compliance Notice (Section 7) */}
          <div className="mb-6 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Platform Safety Notice:</span> WhatsApp links/numbers and Telegram handles are strictly prohibited across all profile fields.
            </div>
          </div>

          {/* Prohibited Warning */}
          {prohibitedWarning && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{prohibitedWarning}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('AGENT')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    role === 'AGENT'
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20 ring-1 ring-purple-500'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm">Agent</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    View & like promotional posts, follow agents & private messaging
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('PLATFORM_CREATOR')}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    role === 'PLATFORM_CREATOR'
                      ? 'bg-pink-600/20 border-pink-500 text-white shadow-md shadow-pink-600/20 ring-1 ring-pink-500'
                      : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm">Platform Creator</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Publish promotional campaigns, boost posts & track analytics
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. Jordan Lee"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="name@example.com"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                  placeholder="At least 6 characters"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Bio / Specialization <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500"
                placeholder="Describe your digital platforms or talent representation focus..."
              />
            </div>

            {/* First Deploy Admin Verification Credentials (Optional at sign-up) */}
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <ShieldAlert className="w-4 h-4 text-pink-400" />
                <span>First Deploy Admin Verification Info (Optional)</span>
              </div>
              <p className="text-[11px] text-gray-400">
                Share your ID and Agency Center now so Platform Admins can direct-message you to verify your Super Level.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                  Your Platform / App User ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={platformId}
                    onChange={(e) => setPlatformId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="e.g. ID: 9841203"
                  />
                  <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Agency Center
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={agencyCenter}
                      onChange={(e) => setAgencyCenter(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Star Agency #88"
                    />
                    <Building2 className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Super Level Rank
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={superLevel}
                      onChange={(e) => setSuperLevel(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                      placeholder="e.g. Super Level 10"
                    />
                    <Award className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!prohibitedWarning}
              className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            Already registered?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
