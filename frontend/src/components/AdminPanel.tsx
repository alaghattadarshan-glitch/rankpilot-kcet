import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Database, Users, Building, Upload, AlertCircle, CheckCircle, Clock, Search, Trash2 } from 'lucide-react';

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

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: ReactNode, color: string }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center space-x-4">
    <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
    </div>
  </div>
);

export default function AdminPanel() {
  const [stats, setStats] = useState({ total_users: 0, total_colleges: 0, total_branches: 0, total_cutoffs: 0 });
  const [users, setUsers] = useState<UserData[]>([]);
  const [logins, setLogins] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{type: string, message: string, error: boolean} | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'logins' | 'datasets'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, loginsRes] = await Promise.all([
        apiClient.get('/admin/stats'),
        apiClient.get('/admin/users'),
        apiClient.get('/admin/logins')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogins(loginsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this user and all associated records?");
    if (!confirm) return;
    try {
      await apiClient.delete(`/admin/user/${userId}`);
      alert("User deleted successfully.");
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

    setUploadStatus({ type, message: 'Uploading...', error: false });
    
    try {
      await apiClient.post(`/admin/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus({ type, message: 'Upload successful. Backend ingestion script required.', error: false });
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadStatus({ type, message: 'Upload failed.', error: true });
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-slate-400 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          Loading platform metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Console</h2>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Platform management and student data overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.total_users} icon={<Users className="w-6 h-6 text-blue-600" />} color="bg-blue-100" />
        <StatCard title="Total Colleges" value={stats.total_colleges} icon={<Building className="w-6 h-6 text-indigo-600" />} color="bg-indigo-100" />
        <StatCard title="Total Branches" value={stats.total_branches} icon={<Database className="w-6 h-6 text-purple-600" />} color="bg-purple-100" />
        <StatCard title="Cutoff Records" value={stats.total_cutoffs} icon={<Database className="w-6 h-6 text-green-600" />} color="bg-green-100" />
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-0">
        {(['users', 'logins', 'datasets'] as const).map(section => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize rounded-t-lg transition-colors border-b-2 -mb-[1px] ${
              activeSection === section
                ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {section === 'users' && <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
            {section === 'logins' && <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
            {section === 'datasets' && <Upload className="w-4 h-4 inline mr-1.5 -mt-0.5" />}
            {section === 'users' ? 'Registered Students' : section === 'logins' ? 'Login History' : 'Datasets'}
          </button>
        ))}
      </div>

      {/* SECTION: Registered Students */}
      {activeSection === 'users' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">KCET Rank</th>
                    <th className="px-5 py-3">Branches</th>
                    <th className="px-5 py-3">Registered</th>
                    <th className="px-5 py-3">Last Login</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {user.name || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-medium">{user.email}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-xs font-bold rounded">{user.category || 'N/A'}</span>
                        </td>
                        <td className="px-5 py-3 font-extrabold text-blue-600 dark:text-blue-400">
                          {user.kcet_rank?.toLocaleString() || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 truncate max-w-[150px]" title={user.preferred_branches.join(', ')}>
                          {user.preferred_branches.join(', ') || 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-xs text-slate-400 font-medium">
                          {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3">
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
                      <td colSpan={9} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                        No matching users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 font-medium">
              Showing {filteredUsers.length} of {users.length} registered students
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Login History */}
      {activeSection === 'logins' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase text-xs font-semibold">
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Login Time</th>
                  <th className="px-5 py-3">IP Address</th>
                  <th className="px-5 py-3">Device / Browser</th>
                  <th className="px-5 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {logins.length > 0 ? (
                  logins.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{log.email}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{new Date(log.login_time).toLocaleString()}</td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-400">{log.ip_address || 'N/A'}</td>
                      <td className="px-5 py-3 text-xs text-slate-400 truncate max-w-[200px]" title={log.user_agent || ''}>
                        {log.user_agent?.split(' ').slice(0, 3).join(' ') || 'N/A'}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-400">{new Date(log.last_activity).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 font-medium italic">
                      No login records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 font-medium">
            Showing last {logins.length} login events
          </div>
        </div>
      )}

      {/* SECTION: Dataset Management */}
      {activeSection === 'datasets' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dataset Management</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Upload new CSV files to update the database.</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { id: 'colleges', name: 'colleges.csv', desc: 'Master list of engineering colleges.' },
              { id: 'branches', name: 'branches.csv', desc: 'Master list of engineering branches.' },
              { id: 'master_cutoffs', name: 'master_cutoffs.csv', desc: 'Historical cutoff data for AI training.' },
              { id: 'fee_structure', name: 'fee_structure.csv', desc: 'Official fee structures by college type.' }
            ].map(dataset => (
              <div key={dataset.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{dataset.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{dataset.desc}</p>
                  {uploadStatus?.type === dataset.id && (
                    <p className={`text-sm mt-2 flex items-center ${uploadStatus.error ? 'text-red-600' : 'text-green-600'}`}>
                      {uploadStatus.error ? <AlertCircle className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                      {uploadStatus.message}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <label className="cursor-pointer bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center space-x-2 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
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
