import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { Target, ListChecks, Scale, BarChart2, Rocket, LogOut, Bell, Moon, Sun, Shield, Phone, Menu, X } from 'lucide-react';

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

const TAB_LABELS: Record<string, string> = {
  preferences: 'My Preferences',
  recommendations: 'Recommendations',
  compare: 'Compare Colleges',
  analytics: 'Analytics',
  simulator: 'Round Simulator',
  'option-entry': 'Option Entry',
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="flex h-screen bg-surface-hover transition-colors duration-300">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-[280px] lg:w-[260px] bg-surface border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-soft transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex transition-transform duration-300 ease-in-out`}>
        <div className="p-6 relative">
          <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-500 flex items-center gap-2">
            🚀 RankPilot
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Navigate Your Engineering Future</p>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 absolute top-4 right-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <button onClick={() => { setActiveTab('preferences'); setIsSidebarOpen(false); }} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'preferences' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Target className="w-5 h-5" /><span>My Preferences</span>
          </button>
          
          <button onClick={() => { setActiveTab('recommendations'); setIsSidebarOpen(false); }} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'recommendations' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <ListChecks className="w-5 h-5" /><span>Recommendations</span>
          </button>
          
          <button onClick={() => { setActiveTab('compare'); setIsSidebarOpen(false); }} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'compare' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Scale className="w-5 h-5" /><span>Compare Colleges</span>
          </button>
          
          <button onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'analytics' ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <BarChart2 className="w-5 h-5" /><span>Analytics</span>
          </button>

          <button onClick={() => { setActiveTab('simulator'); setIsSidebarOpen(false); }} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'simulator' ? 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <Rocket className="w-5 h-5" /><span>Round Simulator</span>
          </button>

          <button onClick={() => { setActiveTab('option-entry'); setIsSidebarOpen(false); }} className={`flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-200 ${activeTab === 'option-entry' ? 'bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <ListChecks className="w-5 h-5" /><span>Option Entry</span>
          </button>

          <a href="/contact" className="flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Phone className="w-5 h-5" /><span>Contact Us</span>
          </a>
          
          {user?.role === 'admin' && (
            <a href="/admin" className="flex w-full items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              <Shield className="w-5 h-5" /><span>Admin Console</span>
            </a>
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
        <header className="sticky top-0 z-10 bg-surface/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 sm:px-8 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 mr-2"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 lg:hidden">
              {TAB_LABELS[activeTab] || 'RankPilot'}
            </span>
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
        <div className="flex-1 overflow-auto p-4 sm:p-8">
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
