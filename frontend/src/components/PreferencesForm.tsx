import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function PreferencesForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    kcet_rank: '',
    category: 'GM',
    is_rural: false,
    is_kannada: false,
    max_budget: '',
    preferred_branches: [] as string[],
    preferred_locations: [] as string[],
    counselling_round: 'Mock'
  });

  const categoryGroups = [
    { label: 'General Merit', options: ['GM', 'GMR', 'GMK'] },
    { label: 'Category 1', options: ['1G', '1R', '1K'] },
    { label: 'Category 2A', options: ['2AG', '2AR', '2AK'] },
    { label: 'Category 2B', options: ['2BG', '2BR', '2BK'] },
    { label: 'Category 3A', options: ['3AG', '3AR', '3AK'] },
    { label: 'Category 3B', options: ['3BG', '3BR', '3BK'] },
    { label: 'Scheduled Caste', options: ['SCG', 'SCR', 'SCK'] },
    { label: 'SC (Sub-categories)', options: ['S1G', 'S1R', 'S1K', 'S2G', 'S2R', 'S2K', 'S3G', 'S3R', 'S3K', 'S4G', 'S4R', 'S4K'] },
    { label: 'Scheduled Tribe', options: ['STG', 'STR', 'STK'] },
  ];
  const rounds = [
    { id: 'Mock', name: '2026 Mock Round' },
    { id: 'Round1', name: 'Round 1' },
    { id: 'Round2', name: 'Round 2' },
    { id: 'Round3', name: 'Round 3' }
  ];
  const branches = [
    { id: 'CS', name: 'Computer Science' },
    { id: 'IE', name: 'Information Science' },
    { id: 'EC', name: 'Electronics & Comm.' },
    { id: 'AI', name: 'AI & Machine Learning' },
    { id: 'DS', name: 'Data Science' },
    { id: 'ME', name: 'Mechanical' },
    { id: 'CE', name: 'Civil' },
    { id: 'EE', name: 'Electrical & Electronics' }
  ];
  const locations = [
    { id: 'Bangalore Urban', name: 'Bangalore Urban' },
    { id: 'Mysore', name: 'Mysore' },
    { id: 'Dakshina Kannada', name: 'Mangalore (D.K)' },
    { id: 'Dharwad', name: 'Hubli/Dharwad' },
    { id: 'Belgaum', name: 'Belagavi' },
    { id: 'Tumkur', name: 'Tumkur' }
  ];

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await apiClient.get('/users/preferences');
        if (response.data) {
          setFormData({
            kcet_rank: response.data.kcet_rank || '',
            category: response.data.category || 'GM',
            is_rural: response.data.is_rural || false,
            is_kannada: response.data.is_kannada || false,
            max_budget: response.data.max_budget || '',
            preferred_branches: response.data.preferred_branches || [],
            preferred_locations: response.data.preferred_locations || [],
            counselling_round: response.data.counselling_round || 'Mock'
          });
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          console.error("Failed to fetch preferences", err);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (type: 'branches' | 'locations', value: string) => {
    setFormData(prev => {
      const array = type === 'branches' ? prev.preferred_branches : prev.preferred_locations;
      const newArray = array.includes(value) 
        ? array.filter(item => item !== value)
        : [...array, value];
      
      return {
        ...prev,
        [type === 'branches' ? 'preferred_branches' : 'preferred_locations']: newArray
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await apiClient.post('/users/preferences', {
        kcet_rank: formData.kcet_rank ? parseInt(formData.kcet_rank as string) : null,
        category: formData.category,
        is_rural: formData.is_rural,
        is_kannada: formData.is_kannada,
        max_budget: formData.max_budget ? parseInt(formData.max_budget as string) : null,
        preferred_branches: formData.preferred_branches,
        preferred_locations: formData.preferred_locations,
        counselling_round: formData.counselling_round
      });
      setMessage({ type: 'success', text: 'Preferences saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rankpilot-card max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8 tracking-tight">Student Profile & Preferences</h2>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core Inputs */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
              <label htmlFor="kcet_rank" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">KCET Rank</label>
            <input
              type="number"
              name="kcet_rank"
              id="kcet_rank"
              value={formData.kcet_rank}
              onChange={handleChange}
              className="mt-2 rankpilot-input"
              placeholder="e.g. 15000"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Reservation Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-2 rankpilot-input"
            >
              {categoryGroups.map(group => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="counselling_round" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Counselling Round</label>
            <select
              id="counselling_round"
              name="counselling_round"
              value={formData.counselling_round}
              onChange={handleChange}
              className="mt-2 rankpilot-input"
            >
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">Determines the isolated dataset used for AI Recommendations.</p>
          </div>

        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex items-center">
            <input
              id="is_rural"
              name="is_rural"
              type="checkbox"
              checked={formData.is_rural}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_rural" className="ml-2 block text-sm text-gray-900 dark:text-slate-300">Rural Quota</label>
          </div>
          <div className="flex items-center">
            <input
              id="is_kannada"
              name="is_kannada"
              type="checkbox"
              checked={formData.is_kannada}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_kannada" className="ml-2 block text-sm text-gray-900 dark:text-slate-300">Kannada Medium Quota</label>
          </div>
        </div>

        {/* Multi-selects */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Preferred Branches</label>
          <div className="flex flex-wrap gap-3">
            {branches.map(branch => (
              <button
                type="button"
                key={branch.id}
                onClick={() => handleArrayChange('branches', branch.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 transform hover:scale-105 active:scale-95
                  ${formData.preferred_branches.includes(branch.id) 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {branch.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Preferred Locations</label>
          <div className="flex flex-wrap gap-3">
            {locations.map(loc => (
              <button
                type="button"
                key={loc.id}
                onClick={() => handleArrayChange('locations', loc.id)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all duration-200 transform hover:scale-105 active:scale-95
                  ${formData.preferred_locations.includes(loc.id) 
                    ? 'bg-secondary-500 text-white border-secondary-500 shadow-md' 
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="rankpilot-button w-full sm:w-auto bg-primary-600 text-white px-10 py-3.5 text-base shadow-md hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/30"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
