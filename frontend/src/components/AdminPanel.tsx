import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Database, Users, Building, Upload, AlertCircle, CheckCircle } from 'lucide-react';

import type { ReactNode } from 'react';

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-4 rounded-full ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  </div>
);

export default function AdminPanel() {
  const [stats, setStats] = useState({ total_users: 0, total_colleges: 0, total_branches: 0, total_cutoffs: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{type: string, message: string, error: boolean} | null>(null);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center h-64">
        <div className="text-gray-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          Loading platform metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-gray-500 mt-1">Superuser controls for platform management and data ingestion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={stats.total_users} icon={<Users className="w-6 h-6 text-blue-600" />} color="bg-blue-600" />
        <StatCard title="Total Colleges" value={stats.total_colleges} icon={<Building className="w-6 h-6 text-indigo-600" />} color="bg-indigo-600" />
        <StatCard title="Total Branches" value={stats.total_branches} icon={<Database className="w-6 h-6 text-purple-600" />} color="bg-purple-600" />
        <StatCard title="Cutoff Records" value={stats.total_cutoffs} icon={<Database className="w-6 h-6 text-green-600" />} color="bg-green-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Dataset Management</h3>
          <p className="text-sm text-gray-500 mt-1">Upload new CSV files to update the database. You must manually trigger the database ingestion script and XGBoost retraining script from the server console after uploading to apply changes.</p>
        </div>
        <div className="p-6 space-y-6">
          {[
            { id: 'colleges', name: 'colleges.csv', desc: 'Master list of engineering colleges.' },
            { id: 'branches', name: 'branches.csv', desc: 'Master list of engineering branches.' },
            { id: 'master_cutoffs', name: 'master_cutoffs.csv', desc: 'Historical cutoff data for AI training.' },
            { id: 'fee_structure', name: 'fee_structure.csv', desc: 'Official fee structures by college type.' }
          ].map(dataset => (
            <div key={dataset.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{dataset.name}</p>
                <p className="text-sm text-gray-500">{dataset.desc}</p>
                {uploadStatus?.type === dataset.id && (
                  <p className={`text-sm mt-2 flex items-center ${uploadStatus.error ? 'text-red-600' : 'text-green-600'}`}>
                    {uploadStatus.error ? <AlertCircle className="w-4 h-4 mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                    {uploadStatus.message}
                  </p>
                )}
              </div>
              <div>
                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                  <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileUpload(e, dataset.id)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
