import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, ListChecks, Scale, BarChart2, Rocket, LogOut, Bell, Moon, Sun, Shield } from 'lucide-react';

const PreferencesForm = lazy(() => import('../components/PreferencesForm'));
const Recommendations = lazy(() => import('../components/Recommendations'));
const CollegeComparison = lazy(() => import('../components/CollegeComparison'));
const OptionEntry = lazy(() => import('../components/OptionEntry'));
const Analytics = lazy(() => import('../components/Analytics'));
const AdminPanel = lazy(() => import('../components/AdminPanel'));
const Simulator = lazy(() => import('../components/Simulator'));

const TabLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
  </div>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-surface-hover transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-[260px] bg-surface border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-soft z-20">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-500 flex items-center gap-2">
            🚀 RankPilot
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Navigate Your Engineering Future</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => setActiveTab('preferences')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'preferences' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Target className="w-5 h-5" /><span>My Preferences</span>
          </button>
          
          <button onClick={() => setActiveTab('recommendations')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'recommendations' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <ListChecks className="w-5 h-5" /><span>Recommendations</span>
          </button>
          
          <button onClick={() => setActiveTab('compare')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'compare' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Scale className="w-5 h-5" /><span>Compare Colleges</span>
          </button>
          
          <button onClick={() => setActiveTab('analytics')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'analytics' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <BarChart2 className="w-5 h-5" /><span>Analytics</span>
          </button>

          <button onClick={() => setActiveTab('simulator')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'simulator' ? 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Rocket className="w-5 h-5" /><span>Round Simulator</span>
          </button>

          <button onClick={() => setActiveTab('option-entry')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'option-entry' ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <ListChecks className="w-5 h-5" /><span>Option Entry</span>
          </button>
          
          {user?.email === 'admin@kcet.ai' && (
            <button onClick={() => setActiveTab('admin')} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'admin' ? 'bg-danger/10 text-danger' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <Shield className="w-5 h-5" /><span>Admin Panel</span>
            </button>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={logout} className="flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium text-danger hover:bg-danger/10 transition-colors">
            <LogOut className="w-5 h-5" /><span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">
            {/* Header left */}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 flex items-center justify-center font-bold text-sm">
                {user?.email?.[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">
                {user?.full_name || user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'preferences' && <PreferencesForm />}
              {activeTab === 'recommendations' && <Recommendations />}
              {activeTab === 'compare' && <CollegeComparison />}
              {activeTab === 'option-entry' && <OptionEntry />}
              {activeTab === 'analytics' && <Analytics />}
              {activeTab === 'simulator' && <Simulator />}
              {activeTab === 'admin' && user?.email === 'admin@kcet.ai' && <AdminPanel />}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
