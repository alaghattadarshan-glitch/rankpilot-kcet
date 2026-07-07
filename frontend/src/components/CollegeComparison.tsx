import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Search, X, CheckCircle2, Scale, Building2, Sparkles, Trophy, Plus } from 'lucide-react';

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

  const filteredColleges = allColleges.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) && !selectedCodes.includes(c.code)).slice(0, 6);

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
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fadeIn">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Side-by-Side Analysis Studio</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-3">
            <Scale className="w-7 h-7 text-blue-200 shrink-0" />
            <span>College Comparison Matrix</span>
          </h2>
          <p className="text-blue-100 text-sm sm:text-base">
            Select up to 4 engineering colleges to evaluate cutoffs, placements, tuition fees, and campus metrics.
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 text-center self-stretch md:self-auto shrink-0">
          <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Selected</span>
          <span className="text-2xl font-extrabold text-white font-mono">{selectedCodes.length} / 4</span>
        </div>
      </div>

      {/* Interactive Search Studio Bar */}
      <div className="rankpilot-card space-y-4 relative z-20">
        <div className="flex items-center border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#161824] rounded-2xl px-4 py-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            className="w-full ml-3 outline-none bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
            placeholder={selectedCodes.length >= 4 ? "Maximum 4 colleges selected." : "Search by college name or code to add to matrix..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={selectedCodes.length >= 4}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Dropdown Results */}
        {search && (
          <div className="absolute left-6 right-6 top-16 z-30 bg-white dark:bg-[#11131d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 animate-scaleIn">
            {filteredColleges.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic">No colleges found matching "{search}".</div>
            ) : (
              filteredColleges.map(c => (
                <div 
                  key={c.code}
                  className="px-5 py-3.5 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer flex items-center justify-between transition-colors"
                  onClick={() => handleSelect(c.code)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg shrink-0">
                    <Plus className="w-3 h-3" /> {c.code}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Selected Tags */}
        {selectedCodes.length > 0 && (
          <div className="flex flex-wrap gap-2.5 pt-2">
            {selectedCodes.map(code => {
              const cName = comparisonData.find(d => d.college_code === code)?.name || allColleges.find(c => c.code === code)?.name;
              return (
                <span key={code} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 shadow-sm animate-scaleIn">
                  <span className="font-mono text-blue-600 dark:text-blue-400">{code}</span>
                  <span className="max-w-[200px] truncate">{cName}</span>
                  <button 
                    onClick={() => handleRemove(code)} 
                    className="ml-1 p-0.5 rounded-full hover:bg-blue-500/20 text-blue-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}
            {selectedCodes.length > 1 && (
              <button
                onClick={() => setSelectedCodes([])}
                className="text-xs font-bold text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Matrix Table */}
      {isLoading ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="rankpilot-card h-16 skeleton-shimmer rounded-2xl" />
          <div className="rankpilot-card h-96 skeleton-shimmer rounded-3xl" />
        </div>
      ) : comparisonData.length > 0 ? (
        <div className="rankpilot-card p-0 overflow-x-auto shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-[#161824] border-b border-slate-200/80 dark:border-slate-800">
                <th className="p-5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-xs w-1/5 bg-slate-100/80 dark:bg-[#161824] sticky left-0 z-10">
                  Metric / Feature
                </th>
                {comparisonData.map(c => (
                  <th key={c.college_code} className="p-5 text-slate-900 dark:text-white font-extrabold text-base sm:text-lg min-w-[240px] border-l border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="truncate">{c.name}</span>
                      <button onClick={() => handleRemove(c.college_code)} className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md inline-block">
                      {c.college_code}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm font-medium">
              
              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10">District / Location</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className="p-5 text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800 font-semibold">
                    {c.district}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10">Institution Type</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className="p-5 text-slate-800 dark:text-slate-200 border-l border-slate-100 dark:border-slate-800">
                    <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {c.type}
                    </span>
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10">
                  <span>Recent Cutoff</span>
                  <span className="block text-[11px] text-slate-400 font-normal mt-0.5">For your preferred branch/category</span>
                </td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className="p-5 border-l border-slate-100 dark:border-slate-800">
                    {c.latest_cutoff ? (
                      <div>
                        <span className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">{c.latest_cutoff}</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">Branch: {c.cutoff_branch}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">No cutoff mapped</span>
                    )}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Average Package</span>
                </td>
                {comparisonData.map(c => {
                  const isWinner = c.college_code === avgPkgWinner;
                  return (
                    <td key={c.college_code} className={`p-5 border-l border-slate-100 dark:border-slate-800 transition-colors ${isWinner ? 'bg-emerald-500/10 dark:bg-emerald-500/10' : ''}`}>
                      {c.avg_package ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-extrabold font-mono ${isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            {c.avg_package} LPA
                          </span>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                              <CheckCircle2 className="w-3 h-3" /> Best
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Highest Package</span>
                </td>
                {comparisonData.map(c => {
                  const isWinner = c.college_code === highestPkgWinner;
                  return (
                    <td key={c.college_code} className={`p-5 border-l border-slate-100 dark:border-slate-800 transition-colors ${isWinner ? 'bg-amber-500/10 dark:bg-amber-500/10' : ''}`}>
                      {c.highest_package ? (
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-extrabold font-mono ${isWinner ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                            {c.highest_package} LPA
                          </span>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                              <CheckCircle2 className="w-3 h-3" /> Max
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10">Govt Quota Fee</td>
                {comparisonData.map(c => {
                  const isWinner = c.college_code === feeWinner;
                  return (
                    <td key={c.college_code} className={`p-5 border-l border-slate-100 dark:border-slate-800 transition-colors ${isWinner ? 'bg-emerald-500/10 dark:bg-emerald-500/10' : ''}`}>
                      {c.fee_govt ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-extrabold text-base ${isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                            ₹{(c.fee_govt/100000).toFixed(2)}L <span className="text-xs font-normal text-slate-400">/ yr</span>
                          </span>
                          {isWinner && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                              <CheckCircle2 className="w-3 h-3" /> Lowest
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">N/A</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              <tr className="hover:bg-slate-50/50 dark:hover:bg-[#161824]/50 transition-colors">
                <td className="p-5 font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-[#11131d] sticky left-0 z-10">Private Quota Fee</td>
                {comparisonData.map(c => (
                  <td key={c.college_code} className="p-5 border-l border-slate-100 dark:border-slate-800">
                    {c.fee_private ? (
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                        ₹{(c.fee_private/100000).toFixed(2)}L <span className="text-xs font-normal text-slate-400">/ yr</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-xs">N/A</span>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      ) : (
        <div className="rankpilot-card text-center py-16 max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
            <Scale className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">Comparison Matrix is Empty</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
            Use the search box above to add up to 4 colleges to evaluate their placement packages, cutoff trends, and fees side by side.
          </p>
        </div>
      )}
    </div>
  );
}
