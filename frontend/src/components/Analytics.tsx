import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Target, MapPin, Users, Wallet, TrendingUp, BarChart2, Lightbulb, Activity } from 'lucide-react';

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
      <div className="rankpilot-card flex items-center justify-center h-64">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-4"></div>
          Analyzing KCET Cutoff Data...
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="rankpilot-card text-center">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No Analytics Available</h3>
        <p className="text-slate-500 mt-2">Data visualization is currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="rankpilot-card bg-gradient-to-r from-primary-50 to-surface dark:from-primary-900/20 dark:to-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Cutoff Analytics Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium">Explore historical trends and distributions across top engineering colleges in Karnataka.</p>
      </div>
      {/* 10. Counsellor Tips */}
      {data.tips && data.tips.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Counsellor Tips</h3>
              <ul className="space-y-2">
                {data.tips.map((tip: string, idx: number) => (
                  <li key={idx} className="text-slate-800 dark:text-slate-300 text-sm font-medium">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Rank Analysis */}
        <div className="rankpilot-card">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Target className="w-6 h-6" />
            <h3 className="text-xl font-bold text-gray-900">Rank Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Your Rank</div>
              <div className="text-2xl font-bold text-gray-900">{data.rank_analysis.rank}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Macro Trend (2024 vs 2025)</div>
              <div className="text-lg font-semibold text-gray-900">{data.rank_analysis.trend}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Estimated Eligible Colleges</div>
              <div className="text-lg font-bold text-blue-600">{data.rank_analysis.eligible_colleges}</div>
            </div>
          </div>
        </div>

        {/* 2. Branch Opportunity Analysis */}
        <div className="rankpilot-card lg:col-span-2">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <BarChart2 className="w-6 h-6" />
            <h3 className="text-xl font-bold text-gray-900">Branch Opportunity</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.branch_opportunity.map((b: any, idx: number) => (
              <div key={idx} className="bg-surface-hover dark:bg-slate-800 p-5 rounded-[16px] border border-slate-100 dark:border-slate-700 hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer">
                <div className="font-bold text-slate-900 dark:text-slate-100 mb-2 truncate">{b.branch}</div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">Total: {b.total} colleges</div>
                <div className="flex justify-between gap-2 text-sm font-bold">
                  <div className="text-success bg-success/10 px-2 py-1 rounded">🟢 Safe : {b.safe}</div>
                  <div className="text-warning bg-warning/10 px-2 py-1 rounded">🟡 Mod : {b.moderate}</div>
                  <div className="text-danger bg-danger/10 px-2 py-1 rounded">🔴 Dream : {b.dream}</div>
                </div>
              </div>
            ))}
          </div>
          {data.branch_opportunity.length === 0 && <p className="text-gray-500 text-sm">Data unavailable.</p>}
        </div>

        {/* 3. Explore Additional Opportunities */}
        <div className="rankpilot-card">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <MapPin className="w-6 h-6" />
            <h3 className="text-xl font-bold text-gray-900">Explore Additional Opportunities</h3>
          </div>
          <div className="space-y-3">
            {data.additional_opportunities && data.additional_opportunities.map((d: any, idx: number) => (
              <div key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-900 font-bold">{d.district}</span>
                  <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{d.count} colleges</span>
                </div>
                <div className="text-sm text-gray-500">{d.reason}</div>
              </div>
            ))}
            {(!data.additional_opportunities || data.additional_opportunities.length === 0) && <p className="text-gray-500 text-sm">Data unavailable.</p>}
          </div>
        </div>

        {/* 4. Category Analysis */}
        <div className="rankpilot-card">
          <div className="flex items-center gap-3 mb-4 text-purple-600">
            <Users className="w-6 h-6" />
            <h3 className="text-xl font-bold text-gray-900">Category Analysis</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Reservation Category</div>
              <div className="text-2xl font-bold text-gray-900">{data.category_analysis.category}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Eligible Colleges</div>
              <div className="text-2xl font-bold text-purple-600">{data.category_analysis.total_eligible}</div>
            </div>
            {data.category_analysis.category !== 'GM' && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <div className="text-sm text-purple-800 font-medium">Compared to GM:</div>
                <div className="text-lg font-bold text-purple-900">+{data.category_analysis.additional_vs_gm} additional opportunities</div>
              </div>
            )}
          </div>
        </div>

        {/* 5. Budget Analysis */}
        {data.budget_analysis && (
          <div className="rankpilot-card">
            <div className="flex items-center gap-3 mb-4 text-secondary-500">
              <Wallet className="w-6 h-6" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Budget Analysis</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Your Max Budget</div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">₹{(data.budget_analysis.budget / 100000).toFixed(2)}L</div>
              </div>
              <div className="flex justify-between items-center bg-secondary-50 dark:bg-secondary-900/30 p-4 rounded-[12px] border border-secondary-100 dark:border-secondary-800">
                <span className="text-secondary-700 dark:text-secondary-400 font-bold">Colleges within budget</span>
                <span className="text-secondary-900 dark:text-secondary-100 font-bold text-lg">{data.budget_analysis.within}</span>
              </div>
              <div className="flex justify-between items-center bg-danger/10 p-4 rounded-[12px] border border-danger/20">
                <span className="text-danger font-bold">Colleges above budget</span>
                <span className="text-danger-700 dark:text-danger-400 font-bold text-lg">{data.budget_analysis.above}</span>
              </div>
            </div>
          </div>
        )}

        {/* 11. Seat Availability Trend */}
        {data.seat_trend && (
           <div className="rankpilot-card">
           <div className="flex items-center gap-3 mb-4 text-danger">
             <Activity className="w-6 h-6" />
             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Seat Availability Trend</h3>
           </div>
           <div className="flex items-center justify-between mb-6">
             <div className="text-center">
               <div className="text-xs font-bold text-slate-500 uppercase">2024</div>
               <div className="font-bold text-2xl text-slate-900 dark:text-slate-100">{data.seat_trend["2024"]}</div>
             </div>
             <div className="text-slate-400 font-bold">→</div>
             <div className="text-center">
               <div className="text-xs font-bold text-slate-500 uppercase">2025</div>
               <div className="font-bold text-2xl text-slate-900 dark:text-slate-100">{data.seat_trend["2025"]}</div>
             </div>
           </div>
           <div className={`text-center font-bold p-3 rounded-[12px] ${data.seat_trend.trend.includes('increasing') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {data.seat_trend.trend}
           </div>
         </div>
        )}

        {/* 6. Branch Demand Trends */}
        <div className="rankpilot-card lg:col-span-3">
          <div className="flex items-center gap-3 mb-6 text-accent-500">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Branch Demand Trends</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.branch_demand.map((b: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 dark:border-slate-700 rounded-[12px] bg-surface-hover dark:bg-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100">{b.branch}</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${b.trend.includes('Growing') ? 'bg-danger/10 text-danger' : b.trend.includes('Declining') ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-600'}`}>{b.trend}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
