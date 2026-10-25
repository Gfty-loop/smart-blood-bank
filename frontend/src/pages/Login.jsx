import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Droplet, Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blood-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative z-10 text-white">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blood-600 to-blood-400 flex items-center justify-center text-3xl shadow-lg shadow-blood-600/30">
            🩸
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Smart Blood Bank</h2>
          <p className="text-xs text-slate-400 mt-1">Hospital Transfusion & Inventory Management (SBBMS)</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Staff Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@bloodbank.org"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blood-500 focus:ring-1 focus:ring-blood-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blood-500 focus:ring-1 focus:ring-blood-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blood-600 to-blood-500 hover:from-blood-500 hover:to-blood-600 text-white font-bold rounded-xl shadow-lg shadow-blood-600/30 transition transform active:scale-[0.99] flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Blood Bank'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Demo Logins for Pair Programming and Testing */}
        <div className="mt-8 pt-6 border-t border-slate-700/60">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
            One-Click Demo Roles
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@bloodbank.org', 'admin123')}
              className="px-2.5 py-2 bg-slate-900/70 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition text-center hover:border-slate-500"
            >
              <span className="block font-bold text-white text-[11px]">Admin</span>
              <span className="text-[10px] text-slate-400">Manager</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff@bloodbank.org', 'staff123')}
              className="px-2.5 py-2 bg-slate-900/70 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition text-center hover:border-slate-500"
            >
              <span className="block font-bold text-white text-[11px]">Staff</span>
              <span className="text-[10px] text-slate-400">Collection</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('tech@bloodbank.org', 'tech123')}
              className="px-2.5 py-2 bg-slate-900/70 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-medium text-slate-300 transition text-center hover:border-slate-500"
            >
              <span className="block font-bold text-white text-[11px]">Technician</span>
              <span className="text-[10px] text-slate-400">Lab Testing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
