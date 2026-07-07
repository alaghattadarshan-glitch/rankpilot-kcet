import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Rocket, Eye, EyeOff, ArrowRight, Check, X as XIcon, Mail, ShieldCheck } from 'lucide-react';

type Step = 'email' | 'otp' | 'details';

export default function Register() {
  const [step, setStep] = useState<Step>('email');

  // Step 1 – email
  const [email, setEmail] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Step 2 – OTP
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 3 – details
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  // Password validation rules
  const passwordRules = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Starts with a capital letter', test: (p: string) => /^[A-Z]/.test(p) },
    { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
    { label: 'Contains a special character', test: (p: string) => /[^a-zA-Z0-9\s]/.test(p) },
  ];
  const allRulesPassed = passwordRules.every(r => r.test(password));

  // ── Step 1: Send OTP ─────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');
    setSendingOtp(true);
    try {
      await apiClient.post('/auth/send-verification', { email });
      setEmailSuccess('OTP sent! Check your email (or the backend console in dev mode).');
      setStep('otp');
    } catch (err: any) {
      setEmailError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setVerifyingOtp(true);
    try {
      await apiClient.post('/auth/verify-otp', { email, otp });
      setStep('details');
    } catch (err: any) {
      setOtpError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // ── Step 3: Create account ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!allRulesPassed) {
      setFormError('Please meet all password requirements.');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', { email, full_name: fullName, password });

      // Auto-login
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      const loginResponse = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      login(loginResponse.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setFormError(detail.map((d: any) => d.msg).join(', ').replace(/Value error, /g, ''));
      } else if (typeof detail === 'string') {
        setFormError(detail);
      } else {
        setFormError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step indicator ───────────────────────────────────────────────────────
  const steps = [
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'otp', label: 'Verify', icon: ShieldCheck },
    { key: 'details', label: 'Account', icon: Rocket },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="flex min-h-screen">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 left-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
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
            Start Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-300">
              College Journey
            </span>
          </h1>
          <p className="text-lg text-purple-100/90 leading-relaxed max-w-md mb-10">
            Join thousands of KCET aspirants using AI to find their dream engineering college. Get personalized recommendations in minutes.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-sm">
            {[
              { value: '200+', label: 'Colleges' },
              { value: '50+', label: 'Branches' },
              { value: '4', label: 'Rounds' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-extrabold text-white font-heading">{stat.value}</div>
                <div className="text-xs text-purple-200/70 font-medium uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 dark:bg-[#090a0f] px-6 py-12 transition-colors duration-300">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white font-heading">RankPilot</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
              Create your account
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Free forever. No credit card required.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isDone = i < currentStepIndex;
              const isActive = i === currentStepIndex;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300 flex-shrink-0
                    ${isDone ? 'bg-green-500 text-white' : isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                    {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`ml-2 text-xs font-semibold hidden sm:block ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isDone ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 rounded transition-colors duration-300 ${isDone ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: Email ──────────────────────────────────────────────── */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {emailError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-fadeIn">
                  <XIcon className="w-5 h-5 flex-shrink-0" />
                  {emailError}
                </div>
              )}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="rankpilot-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  We'll send a verification OTP to this email.
                </p>
              </div>
              <button
                type="submit"
                disabled={sendingOtp}
                className="rankpilot-button w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 focus:ring-4 focus:ring-indigo-500/30 gap-2"
              >
                {sendingOtp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send Verification OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ───────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {emailSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm rounded-2xl flex items-center gap-2 animate-fadeIn">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  {emailSuccess}
                </div>
              )}
              {otpError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-fadeIn">
                  <XIcon className="w-5 h-5 flex-shrink-0" />
                  {otpError}
                </div>
              )}
              <div>
                <label htmlFor="reg-otp" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Enter 6-digit OTP
                </label>
                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                  OTP sent to <span className="font-semibold text-indigo-600 dark:text-indigo-400">{email}</span>
                </p>
                <input
                  id="reg-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  className="rankpilot-input text-center text-2xl font-bold tracking-widest"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <button
                type="submit"
                disabled={verifyingOtp || otp.length !== 6}
                className="rankpilot-button w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 focus:ring-4 focus:ring-indigo-500/30 gap-2"
              >
                {verifyingOtp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ShieldCheck className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setOtpError(''); setEmailSuccess(''); }}
                className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-2"
              >
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── STEP 3: Account Details ────────────────────────────────────── */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded-2xl flex items-center gap-2 animate-fadeIn">
                  <XIcon className="w-5 h-5 flex-shrink-0" />
                  {formError}
                </div>
              )}
              <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-sm rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span><span className="font-semibold">{email}</span> verified ✓</span>
              </div>

              <div>
                <label htmlFor="reg-fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  id="reg-fullName"
                  type="text"
                  required
                  autoComplete="name"
                  className="rankpilot-input"
                  placeholder="Darshan Prabhu K"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
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

              <button
                type="submit"
                disabled={isLoading || !allRulesPassed}
                className="rankpilot-button w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 focus:ring-4 focus:ring-indigo-500/30 gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
