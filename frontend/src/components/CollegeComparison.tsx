import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Search, X, CheckCircle2 } from 'lucide-react';

interface CollegeBasic {
  code: string;
  name: string;
}

interface ComparisonData {
  college_code: string;
  name: string;
  district: string;
  type: string;
  avg_package: number | null;
  highest_package: number | null;
  placement_percent: number | null;
  fee_govt: number | null;
  fee_private: number | null;
  latest_cutoff: number | null;
  cutoff_branch: string | null;
}

export default function CollegeComparison() {
  const [allColleges, setAllColleges] = useState<CollegeBasic[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch all colleges for dropdown
    apiClient.get('/colleges').then(res => setAllColleges(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCodes.length === 0) {
      setComparisonData([]);
      return;
    }
    
    const fetchComparison = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/colleges/compare?codes=${selectedCodes.join(',')}`);
        setComparisonData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComparison();
  }, [selectedCodes]);

  const handleSelect = (code: string) => {
    if (selectedCodes.length < 4 && !selectedCodes.includes(code)) {
      setSelectedCodes([...selectedCodes, code]);
      setSearch('');
    }
  };

  const handleRemove = (code: string) => {
    setSelectedCodes(selectedCodes.filter(c => c !== code));
  };

  const filteredColleges = allColleges.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) && !selectedCodes.includes(c.code)).slice(0, 5);

  const getWinner = (metric: keyof ComparisonData, higherIsBetter: boolean) => {
    if (comparisonData.length < 2) return null;
    let bestValue = comparisonData[0][metric] as number;
    let bestCode = comparisonData[0].college_code;
    
    for (let i = 1; i < comparisonData.length; i++) {
      const val = comparisonData[i][metric] as number;
      if (val === null) continue;
      if (bestValue === null || (higherIsBetter ? val > bestValue : val < bestValue)) {
        bestValue = val;
        bestCode = comparisonData[i].college_code;
      }
    }
    return bestCode;
  };

  const highestPkgWinner = getWinner('highest_package', true);
  const avgPkgWinner = getWinner('avg_package', true);
  const feeWinner = getWinner('fee_govt', false);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8 rankpilot-card bg-gradient-to-r from-primary-50 to-surface dark:from-primary-900/20 dark:to-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">College Comparison</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Select up to 4 colleges to compare side-by-side.</p>
      </div>

      <div className="rankpilot-card mb-8 relative">
        <div className="flex items-center border border-slate-200 dark:border-slate-700 bg-surface-hover dark:bg-slate-800/50 rounded-[12px] px-4 py-3 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="w-full ml-3 outline-none bg-transparent text-slate-900 dark:text-slate-100"
            placeholder="Search for a college to add..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={selectedCodes.length >= 4}
          />
        </div>
        
        {search && (
          <div className="absolute z-10 w-[calc(100%-3rem)] mt-2 bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] shadow-hover max-h-60 overflow-auto">
            {filteredColleges.map(c => (
              <div 
                key={c.code}
                className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-sm font-medium border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 text-slate-700 dark:text-slate-300 transition-colors"
                onClick={() => handleSelect(c.code)}
              >
                {c.name}
              </div>
            ))}
          </div>
        )}

        {selectedCodes.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {selectedCodes.map(code => {
              const cName = comparisonData.find(d => d.college_code === code)?.name || allColleges.find(c => c.code === code)?.name;
              return (
                <span key={code} className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800/50">
                  {cName?.substring(0, 30)}...
                  <button onClick={() => handleRemove(code)} className="ml-3 focus:outline-none p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-[12px] w-full"></div>
          <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-[16px] w-full"></div>
        </div>
      ) : comparisonData.length > 0 ? (
        <div className="rankpilot-card p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider text-xs w-1/5">Features</th>
                {comparisonData.map(c => (
                  <th key={c.college_code} className="p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 font-bold text-lg min-w-[200px]">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">District</td>
                {comparisonData.map(c => <td key={c.college_code} className="p-5 border-b border-slate-100 dark:border-slate-700/50 font-medium text-slate-800 dark:text-slate-200">{c.district}</td>)}
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">Type</td>
                {comparisonData.map(c => <td key={c.college_code} className="p-5 border-b border-slate-100 dark:border-slate-700/50 font-medium text-slate-800 dark:text-slate-200">{c.type}</td>)}
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">Recent Cutoff <br/><span className="text-xs text-slate-400 font-normal">(Your Branch/Cat)</span></td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className="p-5 border-b border-slate-100 dark:border-slate-700/50">
                    {c.latest_cutoff ? <><span className="font-bold text-slate-900 dark:text-slate-100">{c.latest_cutoff}</span> ({c.cutoff_branch})</> : 'N/A'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">Avg Package</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className={`p-5 border-b border-slate-100 dark:border-slate-700/50 ${c.college_code === avgPkgWinner ? 'bg-success/5 dark:bg-success/10' : ''}`}>
                    {c.avg_package ? (
                      <div className="flex items-center">
                        <span className={`font-bold ${c.college_code === avgPkgWinner ? 'text-success-700 dark:text-success-400' : 'text-slate-900 dark:text-slate-100'}`}>{c.avg_package} LPA</span>
                        {c.college_code === avgPkgWinner && <CheckCircle2 className="w-5 h-5 text-success ml-2" />}
                      </div>
                    ) : 'N/A'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">Highest Package</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className={`p-5 border-b border-slate-100 dark:border-slate-700/50 ${c.college_code === highestPkgWinner ? 'bg-success/5 dark:bg-success/10' : ''}`}>
                    {c.highest_package ? (
                      <div className="flex items-center">
                        <span className={`font-bold ${c.college_code === highestPkgWinner ? 'text-success-700 dark:text-success-400' : 'text-slate-900 dark:text-slate-100'}`}>{c.highest_package} LPA</span>
                        {c.college_code === highestPkgWinner && <CheckCircle2 className="w-5 h-5 text-success ml-2" />}
                      </div>
                    ) : 'N/A'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">Govt Quota Fee</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className={`p-5 border-b border-slate-100 dark:border-slate-700/50 ${c.college_code === feeWinner ? 'bg-success/5 dark:bg-success/10' : ''}`}>
                    {c.fee_govt ? (
                      <div className="flex items-center">
                        <span className={`font-bold ${c.college_code === feeWinner ? 'text-success-700 dark:text-success-400' : 'text-slate-900 dark:text-slate-100'}`}>₹{(c.fee_govt/100000).toFixed(2)}L</span>
                        {c.college_code === feeWinner && <CheckCircle2 className="w-5 h-5 text-success ml-2" />}
                      </div>
                    ) : 'N/A'}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-5 border-b border-slate-100 dark:border-slate-700/50 text-slate-500 font-semibold">Private Quota Fee</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className="p-5 border-b border-slate-100 dark:border-slate-700/50">
                    {c.fee_private ? <span className="font-bold text-slate-900 dark:text-slate-100">₹{(c.fee_private/100000).toFixed(2)}L</span> : 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 font-medium bg-surface-hover dark:bg-slate-800/30 rounded-[20px] border border-dashed border-slate-300 dark:border-slate-700">
          Search and select colleges above to compare them here.
        </div>
      )}
    </div>
  );
}
