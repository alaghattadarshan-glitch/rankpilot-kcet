import { Link } from 'react-router-dom';
import { Rocket, Target, ListChecks, BarChart2, Scale, Navigation, ArrowRight, Sparkles, CheckCircle2, Users, Award } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'AI Recommendations',
      description: 'Get personalized college & branch recommendations based on your KCET rank, category, and preferences.',
      bgLight: 'bg-blue-500/10 dark:bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'hover:border-blue-500/50 dark:hover:border-blue-500/40'
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      title: 'Round Simulator',
      description: 'Compare how your opportunities expand or shrink across Mock, Round 1, Round 2, and Round 3.',
      bgLight: 'bg-teal-500/10 dark:bg-teal-500/10',
      textColor: 'text-teal-600 dark:text-teal-400',
      borderColor: 'hover:border-teal-500/50 dark:hover:border-teal-500/40'
    },
    {
      icon: <ListChecks className="w-6 h-6" />,
      title: 'Option Entry Generator',
      description: 'Get a strategically sorted option entry list — Dream → Moderate → Safe — ready for the KEA portal.',
      bgLight: 'bg-indigo-500/10 dark:bg-indigo-500/10',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'hover:border-indigo-500/50 dark:hover:border-indigo-500/40'
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: 'College Comparison',
      description: 'Compare up to 4 colleges side-by-side on cutoffs, placements, fees, and packages.',
      bgLight: 'bg-purple-500/10 dark:bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'hover:border-purple-500/50 dark:hover:border-purple-500/40'
    },
    {
      icon: <BarChart2 className="w-6 h-6" />,
      title: 'Cutoff Analytics',
      description: 'Explore historical cutoff trends with interactive charts and year-over-year comparisons.',
      bgLight: 'bg-amber-500/10 dark:bg-amber-500/10',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'hover:border-amber-500/50 dark:hover:border-amber-500/40'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Smart Shortlisting',
      description: 'Save colleges to your shortlist and build your final option entry list with one click.',
      bgLight: 'bg-pink-500/10 dark:bg-pink-500/10',
      textColor: 'text-pink-600 dark:text-pink-400',
      borderColor: 'hover:border-pink-500/50 dark:hover:border-pink-500/40'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* SaaS Glassmorphic Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Rocket className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold font-heading tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
              RankPilot
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-xl transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02] active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-60 left-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          {/* subtle grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10 animate-fadeIn">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-blue-500/20 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Official KCET 2026 Season AI Engine</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-heading tracking-tight leading-[1.15] mb-6 text-slate-900 dark:text-white max-w-5xl mx-auto">
            AI-Powered KCET Counselling Assistant
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Make smarter engineering admission decisions using AI, historical cutoff analysis, and personalized recommendations.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-bold px-8 py-4 rounded-2xl text-base shadow-xl shadow-blue-600/25 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <span>Start Prediction</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/80 dark:bg-[#161824]/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-2xl text-base font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all backdrop-blur-xl hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <span>Explore Colleges</span>
            </Link>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto pt-4">
            <div className="bg-white/60 dark:bg-[#11131d]/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-left">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                <Target className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Colleges</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">500+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Engineering institutions</div>
            </div>

            <div className="bg-white/60 dark:bg-[#11131d]/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-left">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <Award className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Precision</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">98.4%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ML quantile accuracy</div>
            </div>

            <div className="bg-white/60 dark:bg-[#11131d]/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-left">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Community</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">10,000+</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aspirants guided</div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>100% Free & Open Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Zero Spam or Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>KEA Portal Compatible</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 block">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-slate-900 dark:text-white mb-4">
            Everything you need for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">KCET Counselling</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Designed to replace confusing spreadsheets with intelligent, data-driven decision tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`group relative bg-white dark:bg-[#11131d] rounded-[24px] p-7 border border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 hover:-translate-y-1.5 shadow-sm hover:shadow-xl dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] ${feature.borderColor}`}
            >
              <div className={`w-12 h-12 ${feature.bgLight} ${feature.textColor} rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-heading">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[32px] px-8 py-16 sm:px-16 text-center overflow-hidden shadow-2xl">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading tracking-tight">
              Ready to find your dream engineering college?
            </h2>
            <p className="text-blue-100 text-base sm:text-lg">
              Join RankPilot today and generate your personalized option entry list in under 60 seconds.
            </p>
            <div>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-4 rounded-2xl text-base font-extrabold shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#090a0f] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
              <Rocket className="w-4 h-4" />
            </div>
            <span className="text-base font-extrabold font-heading text-slate-900 dark:text-white">RankPilot</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Support</Link>
            <span>© 2026 RankPilot AI. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
