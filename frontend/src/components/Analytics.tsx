import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Target, Users, Wallet, TrendingUp, BarChart2, Lightbulb, Activity, Sparkles } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get('/analytics/student-insights');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
        <div className="rankpilot-card h-32 skeleton-shimmer rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rankpilot-card h-64 skeleton-shimmer rounded-3xl" />
          <div className="rankpilot-card h-64 skeleton-shimmer rounded-3xl md:col-span-2" />
        </div>
        <div className="rankpilot-card h-64 skeleton-shimmer rounded-3xl" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="rankpilot-card text-center py-16 max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
          <BarChart2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white font-heading">Analytics Studio Offline</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Historical cutoff insights and distribution analytics require your preferences and KCET rank to be saved first.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fadeIn">
      
      {/* SaaS Dashboard Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[28px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Visual Cutoff Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            Counselling Analytics Studio
          </h2>
          <p className="text-blue-100 text-sm sm:text-base">
            Explore macro cutoff trends, branch competition distributions, and seat matrix shifts across Karnataka.
          </p>
        </div>
      </div>

      {/* Counsellor Tips Banner */}
      {data.tips && data.tips.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-indigo-500/30 dark:border-indigo-500/20 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Counsellor Strategic Tips</span>
              <span className="text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">Tailored for you</span>
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium">
              {data.tips.map((tip: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Rank Macro Analysis */}
        <div className="rankpilot-card space-y-5">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Target className="w-5 h-5" />
            <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Rank Position</h3>
          </div>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Your KCET Rank</span>
              <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5 block">{data.rank_analysis?.rank}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#161824] p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Macro Trend (2024 vs 2025)</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">{data.rank_analysis?.trend}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Estimated Eligible Colleges:</span>
              <span className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl">{data.rank_analysis?.eligible_colleges}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Branch Opportunity Distribution */}
        <div className="rankpilot-card md:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <BarChart2 className="w-5 h-5" />
              <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Branch Opportunity Distribution</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Allotment Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.branch_opportunity?.map((b: any, idx: number) => (
              <div key={idx} className="bg-slate-50 dark:bg-[#161824] p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-base truncate pr-2">{b.branch}</span>
                  <span className="text-xs font-extrabold font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg shrink-0">
                    {b.total} Total
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-1.5">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Safe</span>
                    <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300">{b.safe}</span>
                  </div>
                  <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-xl py-1.5">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Mod</span>
                    <span className="text-base font-extrabold font-mono text-amber-700 dark:text-amber-300">{b.moderate}</span>
                  </div>
                  <div className="text-center bg-rose-500/10 border border-rose-500/20 rounded-xl py-1.5">
                    <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">Dream</span>
                    <span className="text-base font-extrabold font-mono text-rose-700 dark:text-rose-300">{b.dream}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Seat Availability Trend */}
        {data.seat_trend && (
          <div className="rankpilot-card space-y-5">
            <div className="flex items-center gap-3 text-rose-500 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Activity className="w-5 h-5" />
              <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Seat Matrix Shift</h3>
            </div>
            
            <div className="flex items-center justify-around bg-slate-50 dark:bg-[#161824] p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">2024 Seats</span>
                <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">{data.seat_trend["2024"]}</span>
              </div>
              <span className="text-slate-400 font-extrabold text-xl">→</span>
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">2025 Seats</span>
                <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400">{data.seat_trend["2025"]}</span>
              </div>
            </div>

            <div className={`text-center font-bold text-xs p-3 rounded-xl border ${data.seat_trend.trend.includes('increasing') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
              {data.seat_trend.trend}
            </div>
          </div>
        )}

        {/* Card 4: Category Advantage */}
        <div className="rankpilot-card space-y-5">
          <div className="flex items-center gap-3 text-violet-600 dark:text-violet-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Users className="w-5 h-5" />
            <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Category Advantage</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reservation Category:</span>
              <span className="text-lg font-extrabold font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 px-3 py-0.5 rounded-lg">{data.category_analysis?.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Eligible Allotments:</span>
              <span className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">{data.category_analysis?.total_eligible}</span>
            </div>
            {data.category_analysis?.category !== 'GM' && (
              <div className="bg-violet-500/10 p-3.5 rounded-xl border border-violet-500/20 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 block">Vs General Merit (GM)</span>
                <span className="text-base font-extrabold text-violet-700 dark:text-violet-200 block mt-0.5">+{data.category_analysis?.additional_vs_gm} Extra College Options</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 5: Budget Analysis */}
        {data.budget_analysis && (
          <div className="rankpilot-card space-y-5">
            <div className="flex items-center gap-3 text-amber-500 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Wallet className="w-5 h-5" />
              <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Budget Evaluation</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Max Budget Limit:</span>
                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">₹{(data.budget_analysis.budget / 100000).toFixed(2)}L</span>
              </div>
              <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Within Budget</span>
                <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{data.budget_analysis.within} colleges</span>
              </div>
              <div className="flex justify-between items-center bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Above Budget</span>
                <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400">{data.budget_analysis.above} colleges</span>
              </div>
            </div>
          </div>
        )}

        {/* Card 6: Branch Demand Trends */}
        <div className="rankpilot-card md:col-span-3 space-y-5">
          <div className="flex items-center gap-3 text-indigo-500 border-b border-slate-100 dark:border-slate-800 pb-3">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">Industry Branch Demand Shifts (2026 Season)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.branch_demand?.map((b: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{b.branch}</span>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  b.trend.includes('Growing') ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 
                  b.trend.includes('Declining') ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 
                  'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {b.trend}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
