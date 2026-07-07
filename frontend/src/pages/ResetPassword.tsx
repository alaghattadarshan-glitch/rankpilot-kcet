import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Rocket, Eye, EyeOff, Check, X as XIcon, ShieldCheck } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If no token in URL, show invalid state
  const hasToken = Boolean(token);

  const passwordRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Starts with a capital letter', test: (p: string) => /^[A-Z]/.test(p) },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains a special character', test: (p: string) => /[^a-zA-Z0-9\s]/.test(p) },
  ];
  const allRulesPassed = passwordRules.every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, new_password: password });
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to reset password. The link may have expired.');
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
            Create New<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
              Password
            </span>
          </h1>
          <p className="text-lg text-blue-100/90 leading-relaxed max-w-md">
            Choose a strong password to secure your RankPilot account.
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

          {!hasToken ? (
            /* ── Invalid / Missing token ────────────────────────────── */
            <div className="text-center animate-fadeIn">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <XIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-3">Invalid Reset Link</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="rankpilot-button inline-flex bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 shadow-lg shadow-blue-600/25 gap-2"
              >
                Request New Link
              </Link>
            </div>
          ) : success ? (
            /* ── Success ────────────────────────────────────────────── */
            <div className="text-center animate-fadeIn">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-heading mb-3">
                Password Reset!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                Your password has been updated successfully. Redirecting to login...
              </p>
              <Link
                to="/login"
                className="rankpilot-button inline-flex bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 shadow-lg shadow-blue-600/25 gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Go to Login
              </Link>
            </div>
          ) : (
            /* ── Form ───────────────────────────────────────────────── */
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                  Set new password
                </h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-fadeIn">
                    <XIcon className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className="rankpilot-input pr-12"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-3 space-y-1.5 animate-fadeIn">
                      {passwordRules.map((rule, i) => {
                        const passed = rule.test(password);
                        return (
                          <div key={i} className={`flex items-center gap-2 text-xs font-medium transition-colors duration-200 ${passed ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {passed ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
                            {rule.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      className={`rankpilot-input pr-12 transition-all ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? 'border-green-400 dark:border-green-600 focus:ring-green-400/30'
                            : 'border-red-400 dark:border-red-600 focus:ring-red-400/30'
                          : ''
                      }`}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className={`mt-1.5 text-xs font-medium flex items-center gap-1 ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                      {passwordsMatch ? <Check className="w-3.5 h-3.5" /> : <XIcon className="w-3.5 h-3.5" />}
                      {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !allRulesPassed || !passwordsMatch}
                  className="rankpilot-button w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 focus:ring-4 focus:ring-blue-500/30 gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Reset Password
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
