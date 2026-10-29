import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Sparkles, Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

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
      const serverMsg = err.response?.data?.error;
      if (serverMsg) {
        setError(serverMsg);
      } else if (!err.response) {
        setError('Unable to reach server. Please check your connection and try again.');
      } else if (err.response.status === 404) {
        setError('API endpoint not found (404). Please verify service configuration.');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
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
