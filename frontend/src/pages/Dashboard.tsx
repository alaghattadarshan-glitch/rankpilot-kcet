import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Target, ListChecks, Scale, BarChart2, Rocket, LogOut, Bell, Moon, Sun, Shield, Phone, Menu, X, Sparkles, ChevronRight, Zap, CheckCircle2, MessageSquare, Compass, BookOpen } from 'lucide-react';

const PreferencesForm = lazy(() => import('../components/PreferencesForm'));
const Recommendations = lazy(() => import('../components/Recommendations'));
const CollegeComparison = lazy(() => import('../components/CollegeComparison'));
const OptionEntry = lazy(() => import('../components/OptionEntry'));
const Analytics = lazy(() => import('../components/Analytics'));
const AdminPanel = lazy(() => import('../components/AdminPanel'));
const Simulator = lazy(() => import('../components/Simulator'));
const MentorChat = lazy(() => import('../components/MentorChat'));
const CareerMapping = lazy(() => import('../components/CareerMapping'));
const BranchFinder = lazy(() => import('../components/BranchFinder'));
const PDFReportGenerator = lazy(() => import('../components/PDFReportGenerator'));

const TabLoader = () => (
  <div className="flex flex-col items-center justify-center h-80 space-y-4 animate-fadeIn">
    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 animate-pulse shadow-lg shadow-blue-500/10">
      <Sparkles className="w-6 h-6 animate-spin" />
    </div>
    <div className="text-slate-500 dark:text-slate-400 font-medium text-sm">
      Loading AI Counselling Module...
    </div>
  </div>
);

const TAB_LABELS: Record<string, string> = {
  preferences: 'Command Center & Preferences',
  recommendations: 'AI College Recommendations',
  compare: 'College Comparison Studio',
  analytics: 'Visual Cutoff Analytics',
  simulator: 'KCET Round Cutoff Simulator',
  'option-entry': 'Option Entry Wizard',
  mentor: 'AI Counselling Mentor',
  career: 'AI Career Mapping Engine',
  'branch-finder': 'Branch Recommendation AI',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.substring(1);
    if (path === 'ai-mentor') return 'mentor';
    if (path === 'career-mapping') return 'career';
    if (path === 'branch-finder') return 'branch-finder';
    return 'preferences';
  });
  const [isDark, setIsDark] = useState(true); // Default to premium dark mode
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Modern SaaS Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-white dark:bg-[#11131d] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col shadow-xl lg:shadow-none transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex transition-transform duration-300 ease-in-out`}>
        {/* Brand Header */}
        <div className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent font-heading">
                RankPilot
              </h2>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest block -mt-0.5">SaaS Edition v3.2</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 absolute top-6 right-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation Categories */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Category 1: Command Center */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Command Center
            </p>
            <button
              onClick={() => { setActiveTab('preferences'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'preferences' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <Target className={`w-4 h-4 ${activeTab === 'preferences' ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                <span>My Preferences</span>
              </div>
              {activeTab === 'preferences' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          </div>

          {/* Category 2: AI Counselling Tools */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              AI Counselling Tools
            </p>
            <button
              onClick={() => { setActiveTab('recommendations'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'recommendations' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className={`w-4 h-4 ${activeTab === 'recommendations' ? 'text-white' : 'text-amber-500'}`} />
                <span>AI Recommendations</span>
              </div>
              {activeTab === 'recommendations' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>

            <button
              onClick={() => { setActiveTab('simulator'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'simulator' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <Rocket className={`w-4 h-4 ${activeTab === 'simulator' ? 'text-white' : 'text-purple-500 dark:text-purple-400'}`} />
                <span>Round Simulator</span>
              </div>
              {activeTab === 'simulator' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>

            <button
              onClick={() => { setActiveTab('option-entry'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'option-entry' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <ListChecks className={`w-4 h-4 ${activeTab === 'option-entry' ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />
                <span>Option Entry Wizard</span>
              </div>
              {activeTab === 'option-entry' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>

            <button
              onClick={() => { setActiveTab('mentor'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'mentor' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className={`w-4 h-4 ${activeTab === 'mentor' ? 'text-white' : 'text-indigo-500'}`} />
                <span>AI Counselling Mentor</span>
              </div>
              {activeTab === 'mentor' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>

            <button
              onClick={() => { setActiveTab('career'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'career' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`w-4 h-4 ${activeTab === 'career' ? 'text-white' : 'text-rose-500'}`} />
                <span>AI Career Mapping</span>
              </div>
              {activeTab === 'career' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>

            <button
              onClick={() => { setActiveTab('branch-finder'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'branch-finder' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <Compass className={`w-4 h-4 ${activeTab === 'branch-finder' ? 'text-white' : 'text-teal-500'}`} />
                <span>Branch Finder AI</span>
              </div>
              {activeTab === 'branch-finder' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          </div>

          {/* Category 3: Market Intelligence */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Market Intelligence
            </p>
            <button
              onClick={() => { setActiveTab('compare'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'compare' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <Scale className={`w-4 h-4 ${activeTab === 'compare' ? 'text-white' : 'text-teal-500 dark:text-teal-400'}`} />
                <span>Compare Colleges</span>
              </div>
              {activeTab === 'compare' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
            
            <button
              onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}
              className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                <span>Visual Analytics</span>
              </div>
              {activeTab === 'analytics' && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          </div>

          {/* Category 4: Support & Admin */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Support & Admin
            </p>
            <a
              href="/contact"
              className="flex w-full items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Contact Us</span>
            </a>
            
            {user?.role === 'admin' && (
              <a
                href="/admin"
                className="flex w-full items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </a>
            )}
          </div>
        </nav>
        
        {/* System Health / Footer Card */}
        <div className="p-4 m-3 rounded-2xl bg-slate-100 dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">ML Engine Ready</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">99.9%</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Sticky SaaS Header */}
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 h-16 flex items-center justify-between px-4 sm:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Workspace /</span>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading">
                {TAB_LABELS[activeTab] || 'Command Center'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>KCET 2026 Season Active</span>
            </div>

            <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
            </button>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/20">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {user?.role === 'admin' ? 'Administrator' : 'Student Pro'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Command Center Hero Card when on preferences tab */}
            {activeTab === 'preferences' && (
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden animate-fadeIn">
                <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-20 -bottom-10 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      AI Prediction Engine Active
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
                      Welcome to your KCET Command Center, {user?.full_name || user?.email?.split('@')[0]}! 👋
                    </h2>
                    <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                      Your historical cutoff data and AI Quantile models are loaded. Update your rank and category preferences below to generate your official counselling list.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 shrink-0">
                    <button
                      onClick={() => setActiveTab('recommendations')}
                      className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-5 py-3 rounded-2xl text-sm transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <span>View AI Recommendations</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveTab('option-entry')}
                      className="bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-3 rounded-2xl text-sm backdrop-blur-md transition-all border border-white/20 cursor-pointer"
                    >
                      Option Entry Wizard
                    </button>
                  </div>
                </div>

                {/* Quick Stats Grid inside Hero */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/15">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">Available Colleges</span>
                    <span className="text-lg font-extrabold font-mono">500+</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-blue-200 block">AI Accuracy</span>
                    <span className="text-lg font-extrabold font-mono">98.4%</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-200 block">Status</span>
                      <span className="text-xs font-bold text-emerald-300">Synchronized</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'preferences' && <PDFReportGenerator />}

            {/* Suspense Loaded Content */}
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'preferences' && <PreferencesForm />}
              {activeTab === 'recommendations' && <Recommendations />}
              {activeTab === 'compare' && <CollegeComparison />}
              {activeTab === 'option-entry' && <OptionEntry />}
              {activeTab === 'analytics' && <Analytics />}
              {activeTab === 'simulator' && <Simulator />}
              {activeTab === 'mentor' && <MentorChat />}
              {activeTab === 'career' && <CareerMapping />}
              {activeTab === 'branch-finder' && <BranchFinder />}
              {activeTab === 'admin' && user?.email === 'admin@kcet.ai' && <AdminPanel />}
            </Suspense>

          </div>
        </div>
      </div>
    </div>
  );
}
