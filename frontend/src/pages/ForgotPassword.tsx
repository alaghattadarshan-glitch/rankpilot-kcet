import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Rocket, Mail, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-20 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-heading">RankPilot</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight mb-6 font-heading">
            Reset Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
              Password
            </span>
          </h1>
          <p className="text-lg text-blue-100/90 leading-relaxed max-w-md">
            Enter your registered email and we'll send you a secure link to reset your password.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 dark:bg-[#090a0f] px-6 py-12 transition-colors duration-300">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-heading">RankPilot</span>
          </div>

          {success ? (
            /* ── Success State ─────────────────────────────────────────── */
            <div className="text-center animate-fadeIn">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-3">
                Check your inbox
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-2">
                If <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span> is registered, a reset link has been sent.
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">
                In dev mode, the link is printed in the <strong>backend console</strong>.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-8 text-left">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">🔍 Dev Mode Tip</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Look for <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">📧 [DEV EMAIL] Password Reset Link</code> in your backend terminal.
                </p>
              </div>
              <Link
                to="/login"
                className="rankpilot-button inline-flex bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 shadow-lg shadow-blue-600/25 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            /* ── Form ─────────────────────────────────────────────────── */
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                  Forgot password?
                </h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Enter your email to receive a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-fadeIn">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      autoComplete="email"
                      className="rankpilot-input pl-12"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="rankpilot-button w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 focus:ring-4 focus:ring-blue-500/30 gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Remember your password?{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Sign in →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
