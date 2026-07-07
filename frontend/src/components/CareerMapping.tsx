import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { BookOpen, TrendingUp, Briefcase, Award, GraduationCap, ChevronRight, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface CareerDetails {
  title: string;
  demand: string;
  salary: string;
  skills: string[];
  roles: string[];
  recruiters: string[];
  higher_studies: string[];
  scope: string;
}

export default function CareerMapping() {
  const [careerData, setCareerData] = useState<Record<string, CareerDetails>>({});
  const [selectedBranch, setSelectedBranch] = useState('CSE');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await apiClient.get('/career/branches');
        setCareerData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCareers();
  }, []);

  // Pre-calculated salary projection data for chart (LPA over years)
  const salaryProjectionData = {
    CSE: [
      { year: 'Entry', salary: 6.5 },
      { year: '3 Yrs', salary: 12.0 },
      { year: '6 Yrs', salary: 22.0 },
      { year: '10 Yrs', salary: 38.0 },
      { year: '15 Yrs', salary: 55.0 }
    ],
    AIML: [
      { year: 'Entry', salary: 8.0 },
      { year: '3 Yrs', salary: 15.0 },
      { year: '6 Yrs', salary: 28.0 },
      { year: '10 Yrs', salary: 45.0 },
      { year: '15 Yrs', salary: 65.0 }
    ],
    "Data Science": [
      { year: 'Entry', salary: 7.5 },
      { year: '3 Yrs', salary: 14.0 },
      { year: '6 Yrs', salary: 25.0 },
      { year: '10 Yrs', salary: 42.0 },
      { year: '15 Yrs', salary: 60.0 }
    ],
    ISE: [
      { year: 'Entry', salary: 6.0 },
      { year: '3 Yrs', salary: 11.0 },
      { year: '6 Yrs', salary: 19.0 },
      { year: '10 Yrs', salary: 32.0 },
      { year: '15 Yrs', salary: 48.0 }
    ],
    ECE: [
      { year: 'Entry', salary: 5.5 },
      { year: '3 Yrs', salary: 10.0 },
      { year: '6 Yrs', salary: 18.0 },
      { year: '10 Yrs', salary: 28.0 },
      { year: '15 Yrs', salary: 42.0 }
    ],
    EEE: [
      { year: 'Entry', salary: 4.5 },
      { year: '3 Yrs', salary: 8.5 },
      { year: '6 Yrs', salary: 15.0 },
      { year: '10 Yrs', salary: 24.0 },
      { year: '15 Yrs', salary: 35.0 }
    ],
    Mechanical: [
      { year: 'Entry', salary: 4.2 },
      { year: '3 Yrs', salary: 8.0 },
      { year: '6 Yrs', salary: 14.0 },
      { year: '10 Yrs', salary: 22.0 },
      { year: '15 Yrs', salary: 32.0 }
    ],
    Civil: [
      { year: 'Entry', salary: 3.8 },
      { year: '3 Yrs', salary: 7.2 },
      { year: '6 Yrs', salary: 12.5 },
      { year: '10 Yrs', salary: 19.0 },
      { year: '15 Yrs', salary: 28.0 }
    ],
    Biotechnology: [
      { year: 'Entry', salary: 4.8 },
      { year: '3 Yrs', salary: 9.0 },
      { year: '6 Yrs', salary: 16.0 },
      { year: '10 Yrs', salary: 26.0 },
      { year: '15 Yrs', salary: 38.0 }
    ]
  };

  if (isLoading || !careerData[selectedBranch]) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        <div className="rankpilot-card h-20 skeleton-shimmer rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rankpilot-card h-96 skeleton-shimmer rounded-3xl" />
          <div className="md:col-span-2 rankpilot-card h-96 skeleton-shimmer rounded-3xl" />
        </div>
      </div>
    );
  }

  const current = careerData[selectedBranch];
  const chartData = salaryProjectionData[selectedBranch as keyof typeof salaryProjectionData] || salaryProjectionData.CSE;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Branch Selection Bar */}
      <div className="rankpilot-card p-4 overflow-x-auto flex gap-2 no-scrollbar scroll-smooth">
        {Object.keys(careerData).map((branch) => (
          <button
            key={branch}
            onClick={() => setSelectedBranch(branch)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shrink-0 transition-all cursor-pointer ${
              selectedBranch === branch
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-[#161824] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-400'
            }`}
          >
            {branch}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side details */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="rankpilot-card space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/25">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{current.title}</h3>
                <span className="text-[10px] uppercase font-bold text-blue-500">{selectedBranch} Track</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {current.scope}
            </p>
            <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Global Demand</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{current.demand}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Est. Packages</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-1 font-mono">{current.salary.split(' - ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Recharts Salary Progression */}
          <div className="rankpilot-card space-y-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">15-Year Salary Growth (LPA)</h4>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#11131d', border: '1px solid #1e2235', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                  />
                  <defs>
                    <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="salary" name="Avg Package (LPA)" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSalary)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side detailed roadmap */}
        <div className="lg:col-span-2 space-y-6">
          {/* Roadmap steps */}
          <div className="rankpilot-card space-y-6">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span>Career Roadmap &amp; Milestones</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
              {[
                { step: "0-2 Years", title: "Associate Specialist", desc: "Gain deep technology fundamentals, contribute to implementation tickets." },
                { step: "3-6 Years", title: "Senior Consultant / Architect", desc: "Lead application feature domains, execute architecture refactoring." },
                { step: "7+ Years", title: "Principal Lead / Director", desc: "Direct engineering strategy, align products with technology scope." }
              ].map((milestone, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-[#161824] rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-2 hover:border-blue-500/20 transition-all">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold bg-blue-500/10 text-blue-500 px-2.5 py-0.5 rounded-lg border border-blue-500/20">{milestone.step}</span>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white pt-1">{milestone.title}</h5>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{milestone.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Required Skills */}
            <div className="rankpilot-card space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Skill Matrix</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {current.skills.map((skill, sIdx) => (
                  <span key={sIdx} className="px-3 py-1.5 bg-slate-50 dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Higher Studies options */}
            <div className="rankpilot-card space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                <span>Higher Studies Route</span>
              </h4>
              <div className="space-y-2">
                {current.higher_studies.map((study, sIdx) => (
                  <div key={sIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <ChevronRight className="w-3.5 h-3.5 text-purple-500" />
                    <span>{study}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Recruiters grid */}
          <div className="rankpilot-card space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Top In-Demand Recruiters</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {current.recruiters.map((rec, rIdx) => (
                <div key={rIdx} className="p-3 bg-slate-50 dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800 rounded-xl text-center font-bold font-heading text-xs text-slate-800 dark:text-slate-300">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
