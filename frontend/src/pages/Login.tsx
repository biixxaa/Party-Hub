import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Sparkles, Lock, Mail, ArrowRight, ShieldAlert, CheckCircle2, UserCheck, Flame } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);

      // Navigate according to user role
      if (res.data.user.role === 'ADMIN') {
        navigate('/admin');
      } else if (res.data.user.role === 'AGENT') {
        navigate('/agent/dashboard');
      } else {
        navigate('/creator/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click demo login helper
  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl shadow-purple-950/40">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-xl shadow-purple-600/30 mb-4">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
            <p className="text-sm text-gray-400 mt-1">
              Sign in to manage promotional campaigns & agent networking
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
              Quick Role Test Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@partyhub.com', 'admin123')}
                className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/40 transition-colors text-left flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <div>
                  <div className="font-semibold">Admin</div>
                  <div className="text-[10px] text-gray-400">admin@partyhub.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('agent.sarah@partyhub.com', 'password123')}
                className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 transition-colors text-left flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold">VIP Agent</div>
                  <div className="text-[10px] text-gray-400">agent.sarah@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('agent.leo@partyhub.com', 'password123')}
                className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 transition-colors text-left flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-semibold">Agent (Leo)</div>
                  <div className="text-[10px] text-gray-400">agent.leo@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('creator.alex@partyhub.com', 'password123')}
                className="p-2 rounded-xl bg-pink-950/40 border border-pink-500/30 text-pink-300 hover:bg-pink-900/40 transition-colors text-left flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-pink-400" />
                <div>
                  <div className="font-semibold">Creator Pro</div>
                  <div className="text-[10px] text-gray-400">creator.alex@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('agent.pending@partyhub.com', 'password123')}
                className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/40 transition-colors text-left flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold">Pending Agent</div>
                  <div className="text-[10px] text-gray-400">agent.pending@...</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
