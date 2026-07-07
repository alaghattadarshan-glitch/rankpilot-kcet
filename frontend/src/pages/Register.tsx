import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Rocket, Eye, EyeOff, ArrowRight, Check, X as XIcon } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!allRulesPassed) {
      setError('Please meet all password requirements.');
      return;
    }

    setIsLoading(true);
    
    try {
      await apiClient.post('/auth/register', {
        email,
        full_name: fullName,
        password
      });

      // Auto-login after registration to avoid signing in again manually
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const loginResponse = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      login(loginResponse.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(', ').replace(/Value error, /g, ''));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-32 left-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Content */}
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

          {/* Stats */}
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
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Free forever. No credit card required.
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
              <label htmlFor="register-fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="register-fullName"
                name="fullName"
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
              <label htmlFor="register-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Email address
              </label>
              <input
                id="register-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rankpilot-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  name="password"
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

              {/* Live password rules indicator */}
              {password.length > 0 && (
                <div className="mt-3 space-y-1.5 animate-fadeIn">
                  {passwordRules.map((rule, i) => {
                    const passed = rule.test(password);
                    return (
                      <div key={i} className={`flex items-center gap-2 text-xs font-medium transition-colors duration-200 ${passed ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {passed ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <XIcon className="w-3.5 h-3.5" />
                        )}
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
