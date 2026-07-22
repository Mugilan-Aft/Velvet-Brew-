import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0806] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#120A06] border border-white/10 rounded-[24px] p-8">
        <div className="text-center mb-10">
          <span className="material-symbols-outlined text-[var(--color-brand-caramel)] text-5xl mb-4 block">local_cafe</span>
          <h1 className="text-2xl font-serif text-[var(--color-brand-caramel)] tracking-wide">Velvet Brew</h1>
          <p className="text-[13px] text-white/40 uppercase tracking-widest mt-1">Staff Access</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-[12px] mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-caramel)] text-sm transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-[var(--color-brand-caramel)] text-sm transition-colors"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 mt-4 rounded-[12px] bg-[var(--color-brand-caramel)] text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
