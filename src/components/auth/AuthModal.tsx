import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { X, Lock, Mail, User, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    loginWithEmail,
    registerWithEmail,
    isLoading,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!authModalOpen) return null;

  const isRegister = authModalMode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError('Please provide your name or business reference.');
          return;
        }
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] border border-[#18181B14] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[12px] bg-[#18181B] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#3B5BDB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 font-plus-jakarta">
                {isRegister ? 'Join Cluey Cart' : 'Sign In to Cluey Cart'}
              </h3>
              <p className="text-[10px] text-zinc-400">
                Niche-aware feedback &amp; action engine
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-zinc-100 text-xs font-semibold bg-[#F8F8F5]">
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('login');
            }}
            className={`flex-1 py-2.5 text-center transition-all ${
              !isRegister
                ? 'border-b-2 border-[#18181B] text-[#18181B] bg-white'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('register');
            }}
            className={`flex-1 py-2.5 text-center transition-all ${
              isRegister
                ? 'border-b-2 border-[#18181B] text-[#18181B] bg-white'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Register
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Google Sign-In Button */}
          <div className="space-y-2">
            <GoogleSignInButton
              label={isRegister ? 'Sign up with Google' : 'Continue with Google'}
              onSuccess={closeAuthModal}
            />

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-zinc-200"></div>
              <span className="px-2 text-[10px] uppercase font-mono text-zinc-400 font-medium">
                or with email
              </span>
              <div className="flex-1 border-t border-zinc-200"></div>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {error && (
              <div className="p-2.5 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            {isRegister && (
              <div>
                <label className="block text-zinc-700 font-medium mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Priyansh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-zinc-700 font-medium mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="merchant@clueycart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-[12px] bg-[#F8F8F5] border border-zinc-200 focus:outline-none focus:border-zinc-400 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-[14px] bg-[#18181B] hover:bg-black text-white font-semibold text-xs transition-colors shadow-xs mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : isRegister ? 'Create Store Account' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
