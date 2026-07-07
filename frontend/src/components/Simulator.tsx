import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ShieldCheck, Target, Sparkles, Navigation, Building, TrendingUp, TrendingDown, Minus, Layers } from 'lucide-react';

interface SimulatorRec {
  college_code: string;
  college_name: string;
  district: string;
  branch_code: string;
  branch_name: string;
  expected_cutoff: number;
  ranking_score: number;
  type: string;
}

interface RoundData {
  total_colleges: number;
  top_5: SimulatorRec[];
}

interface ComparisonResults {
  Mock: RoundData;
  Round1: RoundData;
  Round2: RoundData;
  Round3: RoundData;
}

export default function Simulator() {
  const [data, setData] = useState<ComparisonResults | null>(null);
  const [prefs, setPrefs] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const rounds = [
    { id: 'Mock', label: '2026 Mock Round', desc: 'Initial KEA simulated test allotment' },
    { id: 'Round1', label: 'Round 1 Allotment', desc: 'First official seat allocation' },
    { id: 'Round2', label: 'Round 2 Allotment', desc: 'Post-surrender seat shifts' },
    { id: 'Round3', label: 'Round 3 (Extended)', desc: 'Final mop-up cutoff drops' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [simRes, prefRes] = await Promise.all([
          apiClient.get('/recommendations/simulator'),
          apiClient.get('/users/preferences')
        ]);
        setData(simRes.data);
        setPrefs(prefRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTypeStyle = (type: string) => {
    if (type === 'safe') return { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />, label: "Safe", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    if (type === 'moderate') return { icon: <Target className="w-3.5 h-3.5 text-amber-500" />, label: "Moderate", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    return { icon: <Sparkles className="w-3.5 h-3.5 text-rose-500" />, label: "Dream", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
  };

  const getGrowthIndicator = (currentIndex: number) => {
    if (currentIndex === 0 || !data) return null;
    const currentRound = rounds[currentIndex].id as keyof ComparisonResults;
    const prevRound = rounds[currentIndex - 1].id as keyof ComparisonResults;
    
    const currentTotal = data[currentRound]?.total_colleges || 0;
    const prevTotal = data[prevRound]?.total_colleges || 0;
    
    const diff = currentTotal - prevTotal;
    
    if (diff > 0) {
      return (
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 my-4 shadow-sm animate-scaleIn">
          <TrendingUp className="w-4 h-4" />
          <span>+{diff} New Seat Opportunities Opened</span>
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-extrabold bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20 my-4 shadow-sm animate-scaleIn">
          <TrendingDown className="w-4 h-4" />
          <span>{diff} Opportunities Tightened</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 my-4 shadow-sm">
          <Minus className="w-4 h-4" />
          <span>No Cutoff Shift</span>
        </div>
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fadeIn">
      
      {/* SaaS Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Allotment Forecaster</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading flex items-center gap-3">
            <Navigation className="w-7 h-7 text-blue-200 shrink-0" />
            <span>Round-by-Round Simulator</span>
          </h2>
          <p className="text-blue-100 text-sm sm:text-base">
            Simulate how your college options expand across Mock Round, Round 1, Round 2, and Extended Round 3.
          </p>
        </div>

        {prefs && (
          <div className="bg-white/15 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 text-center self-stretch md:self-auto shrink-0">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">Simulating Rank</span>
            <span className="text-2xl font-extrabold text-white font-mono">#{prefs.kcet_rank}</span>
            <span className="text-[11px] text-blue-200 block mt-0.5">Cat: {prefs.category || 'GM'}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="rankpilot-card h-64 skeleton-shimmer rounded-3xl" />
          <div className="rankpilot-card h-64 skeleton-shimmer rounded-3xl" />
        </div>
      ) : !data ? (
        <div className="rankpilot-card text-center py-16 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">Simulation Data Unavailable</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Please fill out your student preferences and rank in the Dashboard to unlock round-wise simulations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {rounds.map((round, index) => {
            const roundData = data[round.id as keyof ComparisonResults];
            if (!roundData) return null;

            return (
              <div key={round.id} className="flex flex-col items-center">
                {/* Growth Pill */}
                {getGrowthIndicator(index)}

                {/* Round Studio Card */}
                <div className="w-full rankpilot-card p-0 overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all hover:border-blue-500/40">
                  
                  {/* Round Banner */}
                  <div className="bg-slate-50 dark:bg-[#161824] border-b border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 text-white font-mono font-bold text-xs">
                          R{index}
                        </span>
                        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">{round.label}</h3>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-10">{round.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 pl-10 sm:pl-0">
                      <span className="px-4 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-full font-extrabold font-mono text-sm shadow-sm">
                        {roundData.total_colleges} Eligible Options
                      </span>
                    </div>
                  </div>

                  {/* Top 5 College List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {roundData.top_5.length > 0 ? (
                      roundData.top_5.map((item, i) => {
                        const style = getTypeStyle(item.type);
                        return (
                          <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-[#161824]/60 transition-colors gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold font-mono text-sm flex items-center justify-center shrink-0">
                                #{i + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-base text-slate-900 dark:text-white truncate">{item.college_name}</h4>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                                    <Building className="w-3.5 h-3.5" /> {item.branch_name}
                                  </span>
                                  <span>•</span>
                                  <span>District: {item.district}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right hidden sm:block">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Cutoff</span>
                                <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">#{item.expected_cutoff}</span>
                              </div>
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${style.color}`}>
                                {style.icon}
                                <span>{style.label}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-10 text-center text-slate-400 text-sm italic">
                        No realistic college allotments matched in this round based on your rank.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
