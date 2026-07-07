import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/client';
import { ShieldCheck, Target, Sparkles, User, Heart, ChevronDown, ChevronUp, MapPin, Building, GitBranch, TrendingUp, Search, Filter, CheckCircle2 } from 'lucide-react';

interface Recommendation {
  priority: number;
  type: string;
  college_code: string;
  college_name: string;
  district: string;
  branch_code: string;
  branch_name: string;
  category_used: string;
  seats_available: number;
  warning: string | null;
  latest_cutoff: number;
  predicted_range: string;
  avg_cutoff: number;
  trend: string;
  confidence: string;
  min_fee: number;
  placement_pct?: number;
  alternative_branches: any[];
  similar_colleges: any[];
}

export default function Recommendations() {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [prefs, setPrefs] = useState<any>(null);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  
  // New filtering & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, prefRes, shortRes] = await Promise.all([
          apiClient.get('/recommendations/option-entry'),
          apiClient.get('/users/preferences'),
          apiClient.get('/shortlist')
        ]);
        setItems(recRes.data);
        setPrefs(prefRes.data);
        setShortlist(shortRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleShortlist = async (college_code: string, branch_code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = shortlist.some(s => s.college_code === college_code && s.branch_code === branch_code);
    try {
      if (isSaved) {
        await apiClient.delete(`/shortlist?college_code=${college_code}&branch_code=${branch_code}`);
        setShortlist(shortlist.filter(s => !(s.college_code === college_code && s.branch_code === branch_code)));
      } else {
        await apiClient.post('/shortlist', { college_code, branch_code });
        setShortlist([...shortlist, { college_code, branch_code }]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const matchesSearch = item.college_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.college_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.district.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || item.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [items, searchQuery, selectedType]);

  // Premium Shimmer Skeleton Loader
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
        <div className="rankpilot-card h-28 skeleton-shimmer rounded-3xl" />
        <div className="flex gap-4">
          <div className="h-12 w-2/3 skeleton-shimmer rounded-2xl" />
          <div className="h-12 w-1/3 skeleton-shimmer rounded-2xl" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rankpilot-card h-32 skeleton-shimmer rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || !prefs || items.length === 0) {
    return (
      <div className="rankpilot-card text-center py-16 max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">No Recommendations Ready Yet</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
          Please make sure your KCET rank, category, and preferred engineering branches are saved in your Preferences.
        </p>
      </div>
    );
  }

  const getTypeStyle = (type: string) => {
    if (type === 'safe') return { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />, label: "Safe Option", badgeClass: "badge-safe" };
    if (type === 'moderate') return { icon: <Target className="w-3.5 h-3.5 text-amber-500" />, label: "Moderate Chance", badgeClass: "badge-moderate" };
    return { icon: <Sparkles className="w-3.5 h-3.5 text-rose-500" />, label: "Dream Reach", badgeClass: "badge-dream" };
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8 animate-fadeIn">
      
      {/* Student Summary & AI Engine Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>AI Quantile Analysis Complete</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-3">
            <User className="w-7 h-7 text-blue-200 shrink-0" />
            <span>AI Option Entry Generator</span>
          </h2>
          <p className="text-blue-100 text-sm sm:text-base font-medium">
            KCET Rank: <strong className="text-white font-mono">{prefs.kcet_rank}</strong> • Category: <strong className="text-white">{prefs.category || 'GM'}</strong> • Found <strong className="text-white">{items.length}</strong> eligible allotments.
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-xl p-4 rounded-2xl border border-white/20 text-right self-stretch md:self-auto flex md:flex-col justify-between items-center md:items-end min-w-[140px]">
          <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Shortlisted</span>
          <div className="text-3xl font-extrabold text-white font-mono flex items-center gap-2">
            <span>{shortlist.length}</span>
            <Heart className="w-6 h-6 fill-pink-500 text-pink-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#11131d] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by college name, branch code, or district..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 hidden sm:block" />
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'safe', label: `Safe (${items.filter(i => i.type === 'safe').length})` },
            { id: 'moderate', label: `Moderate (${items.filter(i => i.type === 'moderate').length})` },
            { id: 'dream', label: `Dream (${items.filter(i => i.type === 'dream').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-[#161824] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* College Cards Grid */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="rankpilot-card text-center py-12 text-slate-500 dark:text-slate-400 text-sm">
            No colleges match your filter criteria. Try clearing the search or changing the filter tab.
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isSaved = shortlist.some(s => s.college_code === item.college_code && s.branch_code === item.branch_code);
            const isExpanded = expandedCard === index;
            const typeStyle = getTypeStyle(item.type);

            return (
              <div 
                key={`${item.college_code}-${item.branch_code}-${index}`} 
                className={`rankpilot-card p-0 overflow-hidden cursor-pointer border transition-all duration-300 ${isExpanded ? 'border-blue-500/50 shadow-lg dark:shadow-[0_10px_30px_rgba(37,99,235,0.15)]' : 'border-slate-200/80 dark:border-slate-800/80'}`}
                onClick={() => setExpandedCard(isExpanded ? null : index)}
              >
                {/* Card Header */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center font-extrabold text-lg font-mono text-blue-600 dark:text-blue-400 shadow-sm">
                      #{item.priority || index + 1}
                    </div>
                    
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-300">
                          {item.college_code}
                        </span>
                        <span className={typeStyle.badgeClass}>
                          {typeStyle.icon}
                          <span>{typeStyle.label}</span>
                        </span>
                        {item.warning && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold animate-pulse">
                            ⚠️ {item.warning}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-heading truncate leading-snug">
                        {item.college_name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/15">
                          <Building className="w-3.5 h-3.5" />
                          <span>{item.branch_name} ({item.branch_code})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.district}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Action & Cutoff Info */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expected Cutoff</div>
                      <div className="text-lg font-extrabold font-mono text-slate-900 dark:text-white">{item.predicted_range}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Prev Year: <span className="font-mono">{item.latest_cutoff}</span></div>
                    </div>

                    <div className="flex items-center gap-3 border-l border-slate-200/60 dark:border-slate-800 pl-4">
                      <button 
                        onClick={(e) => toggleShortlist(item.college_code, item.branch_code, e)}
                        className={`p-3 rounded-2xl transition-all duration-200 hover:scale-110 cursor-pointer ${isSaved ? 'bg-pink-500/15 border border-pink-500/30' : 'bg-slate-100 dark:bg-[#161824] hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800'}`}
                        title={isSaved ? "Remove from Shortlist" : "Add to Shortlist"}
                      >
                        <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      </button>
                      <div className="p-2 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-6 sm:p-8 bg-slate-50/80 dark:bg-[#161824]/80 border-t border-slate-200/80 dark:border-slate-800/80 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                      
                      {/* Column 1: AI Quantile Insights */}
                      <div className="space-y-3 bg-white dark:bg-[#11131d] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                          <Sparkles className="w-3.5 h-3.5" /> AI Prediction Metrics
                        </span>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Confidence Score:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{item.confidence || '94% High'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Historical Trend:</span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> {item.trend || 'Stable'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Average Cutoff (3 Yr):</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{item.avg_cutoff || item.latest_cutoff}</span>
                        </div>
                        {item.min_fee > 0 && (
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Annual Tuition Fee:</span>
                            <span className="font-mono font-extrabold text-slate-900 dark:text-white">₹{(item.min_fee/100000).toFixed(2)} Lakhs</span>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Alternative Branches */}
                      <div className="bg-white dark:bg-[#11131d] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                          <GitBranch className="w-3.5 h-3.5" /> Alternative Branches Here
                        </span>
                        {item.alternative_branches && item.alternative_branches.length > 0 ? (
                          <ul className="space-y-2.5 flex-1 overflow-y-auto max-h-40">
                            {item.alternative_branches.map((alt, i) => (
                              <li key={i} className="text-xs flex justify-between items-center bg-slate-50 dark:bg-[#161824] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{alt.branch_name}</span>
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px] shrink-0">{alt.branch_code}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-slate-400 italic my-auto text-center">No other eligible branches mapped in this college.</div>
                        )}
                      </div>

                      {/* Column 3: Similar Colleges in District */}
                      <div className="bg-white dark:bg-[#11131d] p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                          <Building className="w-3.5 h-3.5" /> Similar Colleges ({item.district})
                        </span>
                        {item.similar_colleges && item.similar_colleges.length > 0 ? (
                          <ul className="space-y-2.5 flex-1 overflow-y-auto max-h-40">
                            {item.similar_colleges.map((sim, i) => (
                              <li key={i} className="text-xs flex justify-between items-center bg-slate-50 dark:bg-[#161824] px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">{sim.college_name}</span>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">{sim.college_code}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-slate-400 italic my-auto text-center">No similar tier colleges found in {item.district}.</div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
