import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ShieldCheck, Target, Sparkles, Navigation, Building, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    { id: 'Mock', label: '2026 Mock Round' },
    { id: 'Round1', label: 'Round 1' },
    { id: 'Round2', label: 'Round 2' },
    { id: 'Round3', label: 'Round 3' }
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
    if (type === 'safe') return { icon: <ShieldCheck className="w-4 h-4 text-success" />, label: "🟢 Safe", color: "bg-success/10 text-success border-success/20" };
    if (type === 'moderate') return { icon: <Target className="w-4 h-4 text-warning" />, label: "🟡 Moderate", color: "bg-warning/10 text-warning border-warning/20" };
    return { icon: <Sparkles className="w-4 h-4 text-danger" />, label: "🔴 Dream", color: "bg-danger/10 text-danger border-danger/20" };
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
        <div className="flex items-center justify-center gap-2 text-success text-sm font-bold bg-success/10 py-2 rounded-[12px] border border-success/20 my-6 shadow-sm w-56 mx-auto transition-transform hover:scale-105">
          <TrendingUp className="w-4 h-4" /> +{diff} opportunities
        </div>
      );
    } else if (diff < 0) {
      return (
        <div className="flex items-center justify-center gap-2 text-danger text-sm font-bold bg-danger/10 py-2 rounded-[12px] border border-danger/20 my-6 shadow-sm w-56 mx-auto transition-transform hover:scale-105">
          <TrendingDown className="w-4 h-4" /> {diff} opportunities
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-bold bg-slate-100 dark:bg-slate-800 py-2 rounded-[12px] border border-slate-200 dark:border-slate-700 my-6 shadow-sm w-56 mx-auto">
          <Minus className="w-4 h-4" /> No change
        </div>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="rankpilot-card mb-10 text-center bg-gradient-to-r from-secondary-50 to-surface dark:from-secondary-900/20 dark:to-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-3 mb-2">
          <Navigation className="w-8 h-8 text-secondary-600 dark:text-secondary-400" /> 🎯 Round-wise Allotment Simulator
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
          Compare how your opportunities expand or shrink across the counselling rounds. Data is strictly isolated.
        </p>
      </div>

      {isLoading ? (
        <div className="rankpilot-card flex items-center justify-center h-64">
          <div className="text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary-600 mb-4"></div>
            Simulating all rounds...
          </div>
        </div>
      ) : !data ? (
        <div className="rankpilot-card text-center">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No Data Found</h3>
          <p className="text-slate-500 mt-2">Update your preferences to generate the simulation.</p>
        </div>
      ) : (
        <div className="mb-8 text-sm text-slate-500 dark:text-slate-400 font-medium text-center uppercase tracking-wider">
          Simulating possibilities for Rank {prefs?.kcet_rank} • Category {prefs?.category || 'GM'}
        </div>
      )}

      {data && (
        <div className="flex flex-col space-y-6">
          {rounds.map((round, index) => {
            const roundData = data[round.id as keyof ComparisonResults];
            if (!roundData) return null;

            return (
              <div key={round.id} className="flex flex-col items-center">
                {/* Growth Indicator from previous round */}
                {getGrowthIndicator(index)}

                {/* Round Card */}
                <div className="w-full max-w-3xl rankpilot-card p-0">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{round.label}</h3>
                    <div className="px-5 py-2 bg-secondary-100 text-secondary-800 dark:bg-secondary-900/40 dark:text-secondary-300 rounded-full font-bold text-sm shadow-sm">
                      {roundData.total_colleges} colleges
                    </div>
                  </div>
                  
                  <div className="p-0">
                    {roundData.top_5.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {roundData.top_5.map((item, i) => (
                          <div key={i} className="p-5 flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center text-lg mr-5 shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="font-bold text-lg text-slate-900 dark:text-slate-100 truncate pr-4">{item.college_name}</div>
                              <div className="text-sm font-semibold text-secondary-600 dark:text-secondary-400 flex items-center gap-1.5 mt-1">
                                <Building className="w-4 h-4" /> {item.branch_name}
                              </div>
                            </div>
                            <div className="shrink-0 text-right ml-4">
                              <span className={`text-xs px-3 py-1 rounded-full font-bold border whitespace-nowrap ${getTypeStyle(item.type).color}`}>
                                {getTypeStyle(item.type).label}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No realistic options found in this round.
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
