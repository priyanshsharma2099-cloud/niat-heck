import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { X, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, loginWithEmail, registerWithEmail, isLoading } = useAuth();
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              F
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                {isRegister ? 'Create Your Account' : 'Sign In to Feedback Hub'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Review analytics &amp; customer sentiment
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 text-xs font-medium bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              setError('');
              openAuthModal('login');
            }}
            className={`flex-1 py-2 text-center transition-all cursor-pointer ${
              !isRegister
                ? 'border-b-2 border-slate-900 text-slate-900 font-semibold bg-white'
                : 'text-slate-500 hover:text-slate-700'
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
            className={`flex-1 py-2 text-center transition-all cursor-pointer ${
              isRegister
                ? 'border-b-2 border-slate-900 text-slate-900 font-semibold bg-white'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* 1. Primary Google Sign-In Button */}
          <div>
            <GoogleSignInButton
              label={isRegister ? 'Sign up with Google' : 'Continue with Google'}
              onSuccess={closeAuthModal}
            />
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200" />
            <span className="flex-shrink mx-3 text-slate-400 text-[10.5px] uppercase tracking-wider font-medium">
              or continue with email
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Full Name / Merchant
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Merchant"
                    className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 mt-1"
            >
              {isLoading
                ? 'Processing...'
                : isRegister
                ? 'Create Free Account'
                : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Privacy badge */}
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit encrypted authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
