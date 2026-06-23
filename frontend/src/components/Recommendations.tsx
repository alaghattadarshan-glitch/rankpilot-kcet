import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ShieldCheck, Target, Sparkles, User, Heart, ChevronDown, ChevronUp, MapPin, Building, GitBranch, TrendingUp, Wallet } from 'lucide-react';

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
  placement_pct: number;
  alternative_branches: any[];
  similar_colleges: any[];
}

export default function Recommendations() {
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [prefs, setPrefs] = useState<any>(null);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

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

  if (isLoading) {
    return (
      <div className="rankpilot-card flex items-center justify-center h-64">
        <div className="text-slate-500 dark:text-slate-400 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-500 mb-4"></div>
          Generating your highly optimized Option Entry list...
        </div>
      </div>
    );
  }

  if (!items || !prefs || items.length === 0) {
    return (
      <div className="rankpilot-card text-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No Recommendations Found</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Please ensure your KCET Rank and Preferences are saved.</p>
      </div>
    );
  }

  const getTypeStyle = (type: string) => {
    if (type === 'safe') return { icon: <ShieldCheck className="w-4 h-4 text-success" />, label: "🟢 Safe", color: "bg-success/10 text-success border-success/20" };
    if (type === 'moderate') return { icon: <Target className="w-4 h-4 text-warning" />, label: "🟡 Moderate", color: "bg-warning/10 text-warning border-warning/20" };
    return { icon: <Sparkles className="w-4 h-4 text-danger" />, label: "🔴 Dream", color: "bg-danger/10 text-danger border-danger/20" };
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-8">
      {/* Student Summary Header */}
      <div className="rankpilot-card flex justify-between items-center bg-gradient-to-r from-primary-50 to-surface dark:from-primary-900/20 dark:to-slate-800">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <User className="w-8 h-8 text-primary-600 dark:text-primary-400" /> Option Entry Generator
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 font-medium">Rank {prefs.kcet_rank} • Category: {prefs.category || 'GM'} • {items.length} colleges eligible.</p>
        </div>
        <div className="text-right bg-white dark:bg-slate-900 p-4 rounded-[16px] shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Shortlisted</div>
          <div className="text-3xl font-bold text-pink-500 flex items-center gap-2 justify-end">{shortlist.length} <Heart className="w-6 h-6 fill-pink-500 text-pink-500" /></div>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => {
          const isSaved = shortlist.some(s => s.college_code === item.college_code && s.branch_code === item.branch_code);
          const isExpanded = expandedCard === index;
          const typeStyle = getTypeStyle(item.type);

          return (
            <div key={index} className="rankpilot-card p-0 overflow-hidden cursor-pointer" onClick={() => setExpandedCard(isExpanded ? null : index)}>
              {/* Card Header (Always Visible) */}
              <div className="p-6 flex items-center gap-6">
                <div className="flex-shrink-0 w-14 h-14 bg-primary-50 dark:bg-primary-900/50 rounded-full flex items-center justify-center font-bold text-2xl text-primary-600 dark:text-primary-400">
                  {index + 1}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">{item.college_name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {item.college_code}
                    </span>
                    {item.warning && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold animate-pulse">
                        {item.warning}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                    <Building className="w-4 h-4" /> {item.branch_name}
                  </div>
                </div>
                
                <div className="text-right flex-shrink-0 hidden md:block w-32">
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Expected Range</div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.predicted_range}</div>
                  <div className="text-xs text-slate-500 mt-1">Baseline: {item.latest_cutoff}</div>
                </div>

                <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-6 ml-2">
                  <button 
                    onClick={(e) => toggleShortlist(item.college_code, item.branch_code, e)}
                    className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${isSaved ? 'bg-pink-50 dark:bg-pink-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <Heart className={`w-6 h-6 transition-colors ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-slate-400 dark:text-slate-500'}`} />
                  </button>
                  {isExpanded ? <ChevronUp className="w-6 h-6 text-slate-400" /> : <ChevronDown className="w-6 h-6 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Basic Stats */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <MapPin className="w-5 h-5 text-primary-500" /> District: <strong className="ml-1 text-slate-900 dark:text-white">{item.district}</strong>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <Target className="w-5 h-5 text-primary-500" /> Range: <strong className="ml-1 text-slate-900 dark:text-white">{item.predicted_range}</strong>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <TrendingUp className="w-5 h-5 text-accent-500" /> Trend: <strong className="ml-1 text-slate-900 dark:text-white">{item.trend}</strong>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <ShieldCheck className="w-5 h-5 text-secondary-500" /> AI Confidence: <strong className="ml-1 text-slate-900 dark:text-white">{item.confidence}</strong>
                      </div>
                      {item.min_fee && (
                        <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <Wallet className="w-5 h-5 text-accent-500" /> Est. Fee: <strong className="ml-1 text-slate-900 dark:text-white">₹{(item.min_fee/100000).toFixed(2)}L</strong>
                        </div>
                      )}
                    </div>

                    {/* Similar Colleges */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <Building className="w-4 h-4 text-primary-600 dark:text-primary-400" /> Students also consider
                      </h4>
                      {item.similar_colleges && item.similar_colleges.length > 0 ? (
                        <ul className="space-y-3">
                          {item.similar_colleges.map((sim, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700">
                              <span className="truncate pr-2 font-medium">{sim.college_name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-500 dark:text-slate-400 italic">No exact alternatives in this district.</div>
                      )}
                    </div>

                    {/* Alternative Branches */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                        <GitBranch className="w-4 h-4 text-accent-500" /> Alternative Branches here
                      </h4>
                      {item.alternative_branches && item.alternative_branches.length > 0 ? (
                        <ul className="space-y-3">
                          {item.alternative_branches.map((alt, i) => (
                            <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700">
                              <span className="truncate pr-2 font-medium">{alt.branch_name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-slate-500 dark:text-slate-400 italic">No mapped alternative branches.</div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
