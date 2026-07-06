import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Activity,
  Calendar,
  Layers,
  Database,
  Search,
  Download,
  ShieldAlert,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  LogOut,
  Building,
  MapPin,
  GitBranch,
  Clock,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at: string;
  last_login: string | null;
  category: string | null;
  kcet_rank: number | null;
  preferred_branches: string[];
  preferred_locations: string[];
}

interface LoginLog {
  id: string;
  email: string;
  login_time: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: string;
}

interface FeedbackLog {
  college_code: string;
  college_name: string;
  branch_code: string;
  branch_name: string;
  accepted: number;
  rejected: number;
}

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  submitted_date: string;
  status: string; // New, Read, Replied, Closed
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'feedback' | 'logins' | 'contacts' | 'health'>('analytics');
  
  // Data states
  const [users, setUsers] = useState<UserData[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [logins, setLogins] = useState<LoginLog[]>([]);
  const [feedback, setFeedback] = useState<FeedbackLog[]>([]);
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  
  // User Management filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [rankMin, setRankMin] = useState('');
  const [rankMax, setRankMax] = useState('');
  
  // Sorting/Pagination
  const [sortField, setSortField] = useState<'name' | 'kcet_rank' | 'created_at' | 'last_login'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, analyticsRes, loginsRes, feedbackRes, contactsRes, healthRes] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/analytics'),
        apiClient.get('/admin/logins'),
        apiClient.get('/admin/feedback'),
        apiClient.get('/admin/contacts'),
        apiClient.get('/admin/system-health')
      ]);
      setUsers(usersRes.data);
      setAnalytics(analyticsRes.data);
      setLogins(loginsRes.data);
      setFeedback(feedbackRes.data);
      setContacts(contactsRes.data);
      setSystemHealth(healthRes.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field: 'name' | 'kcet_rank' | 'created_at' | 'last_login') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this user and all associated records?");
    if (!confirm) return;
    try {
      await apiClient.delete(`/admin/user/${userId}`);
      alert("User and all associated records permanently deleted successfully.");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  const handleUpdateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/admin/contact/${contactId}/status`, { status: newStatus });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update contact status.");
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this contact inquiry?");
    if (!confirm) return;
    try {
      await apiClient.delete(`/admin/contact/${contactId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete contact inquiry.");
    }
  };

  // Extract unique categories, branches, and locations for filter dropdowns
  const categoriesList = ['All', ...Array.from(new Set(users.map(u => u.category).filter(Boolean)))];
  const branchesList = ['All', ...Array.from(new Set(users.flatMap(u => u.preferred_branches).filter(Boolean)))];
  const districtsList = ['All', ...Array.from(new Set(users.flatMap(u => u.preferred_locations).filter(Boolean)))];

  // Filtering logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || u.category === filterCategory;
    const matchesBranch = filterBranch === 'All' || u.preferred_branches.includes(filterBranch);
    const matchesDistrict = filterDistrict === 'All' || u.preferred_locations.includes(filterDistrict);
    
    const rank = u.kcet_rank || 0;
    const matchesMinRank = rankMin === '' || rank >= parseInt(rankMin);
    const matchesMaxRank = rankMax === '' || rank <= parseInt(rankMax);
    
    return matchesSearch && matchesCategory && matchesBranch && matchesDistrict && matchesMinRank && matchesMaxRank;
  });

  // Sorting logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];
    
    if (sortField === 'name') {
      valA = (a.name || a.email).toLowerCase();
      valB = (b.name || b.email).toLowerCase();
    } else if (sortField === 'kcet_rank') {
      valA = a.kcet_rank ?? Infinity;
      valB = b.kcet_rank ?? Infinity;
    } else if (sortField === 'created_at' || sortField === 'last_login') {
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // CSV Export utility
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Category', 'KCET Rank', 'Preferred Branches', 'Preferred Locations', 'Created At', 'Last Login', 'Role'];
    const csvContent = [
      headers.join(','),
      ...sortedUsers.map(u => [
        `"${u.name || 'N/A'}"`,
        `"${u.email}"`,
        `"${u.category || 'N/A'}"`,
        u.kcet_rank || 'N/A',
        `"${u.preferred_branches.join('; ')}"`,
        `"${u.preferred_locations.join('; ')}"`,
        `"${new Date(u.created_at).toLocaleString()}"`,
        `"${u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}"`,
        `"${u.role}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'RankPilot_Users_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export utility
  const exportExcel = () => {
    const exportData = sortedUsers.map(u => ({
      'Name': u.name || 'N/A',
      'Email': u.email,
      'Category': u.category || 'N/A',
      'KCET Rank': u.kcet_rank || 'N/A',
      'Preferred Branches': u.preferred_branches.join(', '),
      'Preferred Locations': u.preferred_locations.join(', '),
      'Created At': new Date(u.created_at).toLocaleString(),
      'Last Login': u.last_login ? new Date(u.last_login).toLocaleString() : 'Never',
      'Role': u.role
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users Directory');
    XLSX.writeFile(workbook, 'RankPilot_Users_Directory.xlsx');
  };

  const COLORS = ['#3b82f6', '#4f46e5', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 text-slate-500">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <span className="font-medium text-sm">Loading RankPilot Analytics Console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Admin Dashboard Sidebar */}
      <aside className="w-[280px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500 flex items-center gap-2">
            🚀 RankPilot Admin
          </h2>
          <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">RankPilot Analytics Console</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('analytics'); setCurrentPage(1); }}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'analytics'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Analytics Console</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('users'); setCurrentPage(1); }}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>User Management</span>
          </button>

          <button
            onClick={() => { setActiveTab('feedback'); setCurrentPage(1); }}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'feedback'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Feedback Analytics</span>
          </button>

          <button
            onClick={() => { setActiveTab('contacts'); setCurrentPage(1); }}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'contacts'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Contact Inquiries</span>
          </button>

          <button
            onClick={() => { setActiveTab('logins'); setCurrentPage(1); }}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'logins'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Security Audit Logs</span>
          </button>

          <button
            onClick={() => { setActiveTab('health'); setCurrentPage(1); }}
            className={`flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === 'health'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>System Health</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={logout}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-8 z-10 shadow-sm">
          <div className="text-lg font-bold text-slate-800 dark:text-white capitalize">
            {activeTab === 'analytics' && 'Analytics & Operations Console'}
            {activeTab === 'users' && 'User Directory'}
            {activeTab === 'feedback' && 'Recommendation Feedback Tracking'}
            {activeTab === 'contacts' && 'Contact Inquiries'}
            {activeTab === 'logins' && 'Security Audits'}
            {activeTab === 'health' && 'System Health & Dataset Status'}
          </div>
          <div className="flex items-center gap-4">
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold px-3 py-1 rounded-full uppercase">
              Administrator Access
            </span>
          </div>
        </header>

        {/* Tab views */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* TAB 1: ANALYTICS CONSOLE */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-8">
                {/* Analytics Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{analytics.summary.total_users}</h3>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                      <span className="text-emerald-500 font-semibold">+{analytics.summary.users_today}</span> registered today
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users (30D)</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{analytics.summary.active_users}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><Activity className="w-5 h-5" /></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-4">
                      Activity threshold set to last 30 days
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weekly / Monthly</p>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">+{analytics.summary.users_this_week} / +{analytics.summary.users_this_month}</h3>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Calendar className="w-5 h-5" /></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-4">
                      New user registration velocities
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Option Entries</p>
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">{analytics.summary.option_entry_usage}</h3>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><Layers className="w-5 h-5" /></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-4">
                      Total option entries generated
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Feature Usage</p>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                          Recs: {analytics.summary.recommendation_requests}<br />
                          Sims: {analytics.summary.simulator_usage}
                        </h3>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg"><Database className="w-5 h-5" /></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Analytics Views: {analytics.summary.analytics_view_usage}
                    </div>
                  </div>
                </div>

                {/* Recharts Distributions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Counselling Round preferences */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Round Preference Distribution</h4>
                    <div className="h-[260px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.distributions.rounds}
                            cx="50%"
                            cy="50%"
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} (${((percent || 0) * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.distributions.rounds.map((_: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Rank distribution */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Rank Distribution Profile</h4>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.distributions.ranks}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category distribution */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Category Distribution Profile</h4>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.distributions.categories}>
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Popular lists */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-600" /> Popular Branches
                    </h4>
                    <ul className="space-y-3">
                      {analytics.popular.branches.map((b: any, i: number) => (
                        <li key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-sm font-medium">
                          <span>{b.branch}</span>
                          <span className="text-slate-500 font-bold">{b.count} preferences</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" /> Popular Districts
                    </h4>
                    <ul className="space-y-3">
                      {analytics.popular.districts.map((d: any, i: number) => (
                        <li key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-sm font-medium">
                          <span>{d.district}</span>
                          <span className="text-slate-500 font-bold">{d.count} preferences</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-600" /> Top Shortlisted Colleges
                    </h4>
                    <ul className="space-y-3">
                      {analytics.popular.colleges.map((c: any, i: number) => (
                        <li key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-sm font-medium">
                          <span className="truncate pr-2">{c.college_name}</span>
                          <span className="text-slate-500 font-bold flex-shrink-0">{c.count} saves</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search, Filter & Export Controls */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    {/* Search bar */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      />
                    </div>
                    {/* Export tools */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Download className="w-4 h-4" /> Export CSV
                      </button>
                      <button
                        onClick={exportExcel}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                      >
                        <Download className="w-4 h-4" /> Export Excel
                      </button>
                    </div>
                  </div>

                  {/* Filter grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                      <select
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs"
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                      >
                        {categoriesList.map((cat, i) => (
                          <option key={i} value={cat || ''}>{cat || 'N/A'}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Preferred Branch</label>
                      <select
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs"
                        value={filterBranch}
                        onChange={(e) => { setFilterBranch(e.target.value); setCurrentPage(1); }}
                      >
                        {branchesList.map((br, i) => (
                          <option key={i} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Preferred District</label>
                      <select
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs"
                        value={filterDistrict}
                        onChange={(e) => { setFilterDistrict(e.target.value); setCurrentPage(1); }}
                      >
                        {districtsList.map((dist, i) => (
                          <option key={i} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Min Rank</label>
                      <input
                        type="number"
                        placeholder="e.g. 1"
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs"
                        value={rankMin}
                        onChange={(e) => { setRankMin(e.target.value); setCurrentPage(1); }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Max Rank</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg text-xs"
                        value={rankMax}
                        onChange={(e) => { setRankMax(e.target.value); setCurrentPage(1); }}
                      />
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('kcet_rank')}>
                            <div className="flex items-center gap-1">Rank <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-6 py-4">Branches</th>
                          <th className="px-6 py-4">Districts</th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('created_at')}>
                            <div className="flex items-center gap-1">Joined <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('last_login')}>
                            <div className="flex items-center gap-1">Last Login <ArrowUpDown className="w-3 h-3" /></div>
                          </th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {currentUsers.length > 0 ? (
                          currentUsers.map((user, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white truncate max-w-[150px]">
                                {user.name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{user.email}</td>
                              <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs font-bold rounded">{user.category || 'GM'}</span></td>
                              <td className="px-6 py-4 font-extrabold text-blue-600 dark:text-blue-400">{user.kcet_rank?.toLocaleString() || 'N/A'}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500 truncate max-w-[180px]" title={user.preferred_branches.join(', ')}>
                                {user.preferred_branches.join(', ') || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-500 truncate max-w-[180px]" title={user.preferred_locations.join(', ')}>
                                {user.preferred_locations.join(', ') || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  user.role === 'admin' 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200' 
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {user.role !== 'admin' && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={10} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                              No matching users found inside database directory.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination footer */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/20 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, sortedUsers.length)} of {sortedUsers.length} users
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="p-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold px-3">Page {currentPage} of {totalPages}</span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="p-1 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: FEEDBACK ANALYTICS */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Recommendation Performance</h3>
                  <p className="text-sm text-slate-500">Track which college and branch recommendations are accepted (added to shortlist) or rejected by KCET students.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                        <th className="px-6 py-4">College Name</th>
                        <th className="px-6 py-4">Branch Code</th>
                        <th className="px-6 py-4">Branch Name</th>
                        <th className="px-6 py-4 text-center">Accepted</th>
                        <th className="px-6 py-4 text-center">Rejected</th>
                        <th className="px-6 py-4 text-right">Acceptance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {feedback.length > 0 ? (
                        feedback.map((item, idx) => {
                          const total = item.accepted + item.rejected;
                          const rate = total > 0 ? (item.accepted / total) * 100 : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white truncate max-w-[280px]">
                                {item.college_name} <span className="text-xs font-medium text-slate-400 ml-1">({item.college_code})</span>
                              </td>
                              <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-xs font-bold rounded">{item.branch_code}</span></td>
                              <td className="px-6 py-4 text-slate-500 font-medium">{item.branch_name}</td>
                              <td className="px-6 py-4 text-center font-bold text-emerald-600">{item.accepted}</td>
                              <td className="px-6 py-4 text-center font-bold text-rose-600">{item.rejected}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full" style={{ width: `${rate}%` }}></div>
                                  </div>
                                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">{rate.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                            No student recommendation feedback logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: CONTACT INQUIRIES */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Public Contact Inquiry Submissions</h3>
                  <p className="text-sm text-slate-500">View and manage support inquiries received via the contact page.</p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Subject</th>
                          <th className="px-6 py-4">Message</th>
                          <th className="px-6 py-4">Submitted</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                        {contacts.length > 0 ? (
                          contacts.map((c, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{c.name}</td>
                              <td className="px-6 py-4 font-semibold text-slate-500">{c.email}</td>
                              <td className="px-6 py-4 font-medium text-slate-500">{c.phone || 'N/A'}</td>
                              <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={c.subject}>{c.subject}</td>
                              <td className="px-6 py-4 text-xs font-medium text-slate-500 truncate max-w-[200px]" title={c.message}>{c.message}</td>
                              <td className="px-6 py-4 text-xs text-slate-400">{new Date(c.submitted_date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <select
                                  value={c.status}
                                  onChange={(e) => handleUpdateContactStatus(c.id, e.target.value)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                                    c.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    c.status === 'Read' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                    c.status === 'Replied' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200' // Closed
                                  }`}
                                >
                                  <option value="New">New</option>
                                  <option value="Read">Read</option>
                                  <option value="Replied">Replied</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleDeleteContact(c.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                                  title="Delete Inquiry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                              No contact submissions registered.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SECURITY AUDIT LOGS */}
            {activeTab === 'logins' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-amber-500" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Auditing Console</h3>
                    <p className="text-sm text-slate-500">Audit session logs, captured IP addresses, and user browser user-agents for system logging.</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                        <th className="px-6 py-4">User Email</th>
                        <th className="px-6 py-4">Login Timestamp</th>
                        <th className="px-6 py-4">IP Address</th>
                        <th className="px-6 py-4">User Agent</th>
                        <th className="px-6 py-4 text-right">Last System Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {logins.length > 0 ? (
                        logins.map((log, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{log.email}</td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{new Date(log.login_time).toLocaleString()}</td>
                            <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400">{log.ip_address || '127.0.0.1'}</td>
                            <td className="px-6 py-4 text-xs text-slate-400 max-w-[260px] truncate" title={log.user_agent || 'N/A'}>
                              {log.user_agent || 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">
                              {new Date(log.last_activity).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                            No security login records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: SYSTEM HEALTH */}
            {activeTab === 'health' && systemHealth && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Backend Server Status */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backend Status</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                      <h4 className="text-xl font-bold text-emerald-600">{systemHealth.backend_status}</h4>
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database Status</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${systemHealth.database_status === 'Healthy' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">{systemHealth.database_status}</h4>
                    </div>
                  </div>

                  {/* AI Model Status */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Quantile Predictor</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${systemHealth.ai_model_status === 'Loaded' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">{systemHealth.ai_model_status}</h4>
                    </div>
                  </div>

                  {/* Last Dataset Update */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dataset Update</p>
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-2 truncate">
                      {systemHealth.last_dataset_update !== 'Never updated'
                        ? new Date(systemHealth.last_dataset_update).toLocaleString()
                        : 'Never Updated'}
                    </h4>
                  </div>
                </div>

                {/* Model Training status */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Model Ingestion & Training Logs</h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Last automatic ML models training completion time: 
                    <span className="font-semibold text-slate-700 dark:text-slate-200 ml-1">
                      {systemHealth.last_model_training_time !== 'Never trained'
                        ? new Date(systemHealth.last_model_training_time).toLocaleString()
                        : 'Never Trained'}
                    </span>
                  </p>
                </div>

                {/* Dataset Table */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-md font-bold text-slate-900 dark:text-white">Active Database Datasets</h3>
                  </div>
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                        <th className="px-6 py-4">Dataset Name</th>
                        <th className="px-6 py-4 text-center">Year</th>
                        <th className="px-6 py-4 text-center">Round</th>
                        <th className="px-6 py-4 text-center">Data Rows</th>
                        <th className="px-6 py-4">Last Modified</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {systemHealth.datasets && systemHealth.datasets.length > 0 ? (
                        systemHealth.datasets.map((d: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{d.dataset_name}</td>
                            <td className="px-6 py-4 text-center font-semibold text-slate-500">{d.year}</td>
                            <td className="px-6 py-4 text-center font-medium text-slate-500">{d.round}</td>
                            <td className="px-6 py-4 text-center font-bold text-blue-600 dark:text-blue-400">{d.rows.toLocaleString()}</td>
                            <td className="px-6 py-4 text-xs text-slate-400">{new Date(d.last_modified).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-xs font-bold uppercase">
                                {d.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                            No loaded cutoff datasets found. Run pipeline ingestion.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
