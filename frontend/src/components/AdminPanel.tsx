import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Database, Users, Building, Upload, AlertCircle, CheckCircle, Clock, Search, Trash2, Shield, Activity, RefreshCw, Sparkles, Server } from 'lucide-react';
import type { ReactNode } from 'react';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at: string;
  last_login: string | null;
  category: string | null;
  kcet_rank: number | null;
  preferred_branches: string[] | null;
  preferred_locations: string[] | null;
}

interface LoginLog {
  id: string;
  email: string;
  login_time: string;
  ip_address: string | null;
  user_agent: string | null;
  last_activity: string;
}

interface ActivityLogItem {
  id: string;
  activity_type: string;
  timestamp: string;
  email: string;
}

const StatCard = ({ title, value, icon, badge }: { title: string, value: number | string, icon: ReactNode, badge?: string }) => (
  <div className="rankpilot-card space-y-3 relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-200/80 dark:border-slate-800">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
    <div className="flex items-baseline justify-between">
      <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
      {badge && (
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
          {badge}
        </span>
      )}
    </div>
  </div>
);

export default function AdminPanel() {
  const [stats, setStats] = useState({ total_users: 0, total_colleges: 0, total_branches: 0, total_cutoffs: 0 });
  const [users, setUsers] = useState<UserData[]>([]);
  const [logins, setLogins] = useState<LoginLog[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{type: string, message: string, error: boolean} | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'logins' | 'activity' | 'datasets'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [statsRes, usersRes, loginsRes, actRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/logins'),
        apiClient.get('/admin/activity').catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setLogins(Array.isArray(loginsRes.data) ? loginsRes.data : []);
      setActivities(Array.isArray(actRes.data) ? actRes.data : []);
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this student account and all their saved counselling records?");
    if (!confirmDelete) return;
    try {
      await apiClient.delete(`/admin/user/${userId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete user.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus({ type, message: 'Uploading file to server...', error: false });
    
    try {
      await apiClient.post(`/admin/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus({ type, message: 'Upload successful! Ready for AI ingestion pipeline.', error: false });
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadStatus({ type, message: 'Upload failed. Please verify file format.', error: true });
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        <div className="rankpilot-card h-32 skeleton-shimmer rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rankpilot-card h-28 skeleton-shimmer rounded-2xl" />
          <div className="rankpilot-card h-28 skeleton-shimmer rounded-2xl" />
          <div className="rankpilot-card h-28 skeleton-shimmer rounded-2xl" />
          <div className="rankpilot-card h-28 skeleton-shimmer rounded-2xl" />
        </div>
        <div className="rankpilot-card h-96 skeleton-shimmer rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn">
      
      {/* SaaS Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[28px] p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-rose-500/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-rose-300 uppercase tracking-wider border border-rose-500/30">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>Administrator Command Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-3">
            <span>Platform Governance &amp; Data Studio</span>
          </h2>
          <p className="text-slate-300 text-sm sm:text-base">
            Real-time student registry inspection, system logs, cutoff training datasets, and security audit trails.
          </p>
        </div>

        <button 
          onClick={fetchData} 
          disabled={isRefreshing}
          className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs backdrop-blur-md transition-all border border-white/10 flex items-center gap-2 cursor-pointer disabled:opacity-50 self-stretch md:self-auto justify-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Registered Students" value={stats.total_users} icon={<Users className="w-5 h-5" />} badge="Active DB" />
        <StatCard title="Master Colleges" value={stats.total_colleges} icon={<Building className="w-5 h-5" />} badge="Verified" />
        <StatCard title="Engineering Branches" value={stats.total_branches} icon={<Database className="w-5 h-5" />} badge="Mapped" />
        <StatCard title="Cutoff Records" value={stats.total_cutoffs} icon={<Server className="w-5 h-5" />} badge="AI Trained" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['users', 'logins', 'activity', 'datasets'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === section
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 scale-105'
                : 'bg-slate-100 dark:bg-[#161824] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {section === 'users' && <Users className="w-4 h-4" />}
            {section === 'logins' && <Clock className="w-4 h-4" />}
            {section === 'activity' && <Activity className="w-4 h-4" />}
            {section === 'datasets' && <Upload className="w-4 h-4" />}
            <span>
              {section === 'users' ? `Registered Students (${users.length})` : 
               section === 'logins' ? 'Login Audit Trail' : 
               section === 'activity' ? 'AI Activity Feed' : 'Dataset Ingestion'}
            </span>
          </button>
        ))}
      </div>

      {/* SECTION: Registered Students */}
      {activeSection === 'users' && (
        <div className="rankpilot-card space-y-4 p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161824]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#11131d] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-xs font-bold text-slate-400">
              Showing {filteredUsers.length} of {users.length} accounts in SQLite DB
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-[#161824] border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 sm:p-5">Student Name</th>
                  <th className="p-4 sm:p-5">Email Address</th>
                  <th className="p-4 sm:p-5 text-center">Category</th>
                  <th className="p-4 sm:p-5">KCET Rank</th>
                  <th className="p-4 sm:p-5">Preferred Branches</th>
                  <th className="p-4 sm:p-5">Registered On</th>
                  <th className="p-4 sm:p-5">Last Login</th>
                  <th className="p-4 sm:p-5 text-center">Role</th>
                  <th className="p-4 sm:p-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const branchesStr = Array.isArray(user.preferred_branches) && user.preferred_branches.length > 0 
                      ? user.preferred_branches.join(', ') 
                      : 'None configured';
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-[#161824]/60 transition-colors">
                        <td className="p-4 sm:p-5 font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                          {user.name || <span className="text-slate-400 italic font-normal">No Name Set</span>}
                        </td>
                        <td className="p-4 sm:p-5 text-slate-700 dark:text-slate-300 font-mono text-xs">{user.email}</td>
                        <td className="p-4 sm:p-5 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold uppercase rounded-lg">
                            {user.category || 'GM'}
                          </span>
                        </td>
                        <td className="p-4 sm:p-5 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {user.kcet_rank ? `#${user.kcet_rank.toLocaleString()}` : <span className="text-slate-400 font-normal italic">Pending</span>}
                        </td>
                        <td className="p-4 sm:p-5 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={branchesStr}>
                          {branchesStr}
                        </td>
                        <td className="p-4 sm:p-5 text-xs text-slate-400 font-mono">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 sm:p-5 text-xs text-slate-400 font-mono">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td className="p-4 sm:p-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 sm:p-5 text-center">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete Student Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400 font-medium italic">
                      No matching student accounts found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: Login Audit Trail */}
      {activeSection === 'logins' && (
        <div className="rankpilot-card p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161824]/50 flex items-center justify-between">
            <h3 className="font-extrabold font-heading text-slate-900 dark:text-white text-base">Recent Authentication Logs</h3>
            <span className="text-xs font-bold text-slate-400">Showing last {logins.length} login sessions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-[#161824] border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 sm:p-5">User Email</th>
                  <th className="p-4 sm:p-5">Login Timestamp</th>
                  <th className="p-4 sm:p-5">IP Address</th>
                  <th className="p-4 sm:p-5">Client Device / Browser</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {logins.length > 0 ? (
                  logins.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-[#161824]/60 transition-colors">
                      <td className="p-4 sm:p-5 font-bold font-mono text-xs text-slate-900 dark:text-white">{log.email}</td>
                      <td className="p-4 sm:p-5 text-xs text-slate-500 dark:text-slate-400 font-mono">{new Date(log.login_time).toLocaleString()}</td>
                      <td className="p-4 sm:p-5 text-xs font-mono text-blue-600 dark:text-blue-400">{log.ip_address || '127.0.0.1'}</td>
                      <td className="p-4 sm:p-5 text-xs text-slate-400 truncate max-w-[240px]" title={log.user_agent || ''}>
                        {log.user_agent?.split(' ').slice(0, 4).join(' ') || 'Standard Web Browser'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-medium italic">
                      No login audit trail records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: AI Activity Feed */}
      {activeSection === 'activity' && (
        <div className="rankpilot-card p-0 overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161824]/50 flex items-center justify-between">
            <h3 className="font-extrabold font-heading text-slate-900 dark:text-white text-base">Real-Time AI Tool Usage Stream</h3>
            <span className="text-xs font-bold text-slate-400">Showing {activities.length} recent events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-[#161824] border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="p-4 sm:p-5">Student Email</th>
                  <th className="p-4 sm:p-5">AI Activity / Tool Triggered</th>
                  <th className="p-4 sm:p-5">Event Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/60 dark:hover:bg-[#161824]/60 transition-colors">
                      <td className="p-4 sm:p-5 font-bold font-mono text-xs text-slate-900 dark:text-white">{act.email}</td>
                      <td className="p-4 sm:p-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase">
                          <Sparkles className="w-3 h-3" />
                          <span>{act.activity_type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="p-4 sm:p-5 text-xs text-slate-500 dark:text-slate-400 font-mono">{new Date(act.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-slate-400 font-medium italic">
                      No AI tool activity logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: Dataset Management */}
      {activeSection === 'datasets' && (
        <div className="rankpilot-card space-y-6 shadow-xl">
          <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Cutoff &amp; College Dataset Ingestion</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload official KEA CSV datasets to update training weights and counselling prediction tables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'colleges', name: 'colleges.csv', desc: 'Master list of engineering institutions & codes.' },
              { id: 'branches', name: 'branches.csv', desc: 'Master list of engineering branches & seat matrix.' },
              { id: 'master_cutoffs', name: 'master_cutoffs.csv', desc: 'Historical KCET cutoff ranks for AI training.' },
              { id: 'fee_structure', name: 'fee_structure.csv', desc: 'Tuition fees across govt & private quotas.' }
            ].map(dataset => (
              <div key={dataset.id} className="p-5 bg-slate-50 dark:bg-[#161824] rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="font-extrabold font-mono text-slate-900 dark:text-white text-sm">{dataset.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{dataset.desc}</p>
                  {uploadStatus?.type === dataset.id && (
                    <p className={`text-xs mt-2 font-bold flex items-center gap-1 ${uploadStatus.error ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {uploadStatus.error ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>{uploadStatus.message}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-end">
                  <label className="cursor-pointer bg-white dark:bg-[#11131d] hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, dataset.id)} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
