import { useState } from 'react';
import { apiClient } from '../api/client';
import { Compass, HelpCircle, ArrowRight, RefreshCw, Sparkles, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface QuizQuestion {
  key: string;
  question: string;
  description: string;
}

const QUESTIONS: QuizQuestion[] = [
  { key: 'likes_coding', question: 'Do you enjoy writing code or solving software algorithms?', description: 'Active interest in software programming, logical structures, and web technologies.' },
  { key: 'likes_maths', question: 'Do you enjoy mathematics, probability, and numerical analytics?', description: 'Crucial for ML modeling, deep learning architectures, and statistics.' },
  { key: 'likes_electronics', question: 'Are you interested in electronics, microprocessors, and circuit layout design?', description: 'Explores physics, signaling protocols, and embedded components.' },
  { key: 'likes_problem_solving', question: 'Do you enjoy logical problem-solving and puzzle diagnostics?', description: 'The baseline core skill for all engineering practices.' },
  { key: 'prefers_software', question: 'Do you prefer an office-based software developer job over physical on-site work?', description: 'Determines orientation between soft tech vs. civil/mech core infrastructures.' },
  { key: 'wants_research', question: 'Are you interested in academic research, model optimization, or genetics?', description: 'Key for biotechnology, advanced AI frameworks, and PhD tracks.' },
  { key: 'prefers_core', question: 'Are you interested in mechanical thermodynamics, motors, or skyscraper structures?', description: 'The bedrock of civil and mechanical engineering grids.' }
];

export default function BranchFinder() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (val: boolean) => {
    const key = QUESTIONS[currentStep].key;
    setAnswers(prev => ({ ...prev, [key]: val }));

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitQuiz({ ...answers, [key]: val });
    }
  };

  const submitQuiz = async (finalAnswers: Record<string, boolean>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        likes_coding: finalAnswers.likes_coding || false,
        likes_maths: finalAnswers.likes_maths || false,
        likes_electronics: finalAnswers.likes_electronics || false,
        likes_problem_solving: finalAnswers.likes_problem_solving || false,
        prefers_software: finalAnswers.prefers_software || false,
        wants_research: finalAnswers.wants_research || false,
        prefers_core: finalAnswers.prefers_core || false
      };
      const res = await apiClient.post('/career/suitability', payload);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to submit suitability questionnaire. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentStep(0);
    setResults(null);
  };

  if (results) {
    // Format suitability data for chart
    const chartData = Object.entries(results.scores).map(([branch, score]) => ({
      branch,
      score: score as number
    })).sort((a, b) => b.score - a.score);

    // Curate color palettes based on suitability score
    const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#a78bfa', '#c084fc', '#f472b6', '#fb7185', '#f87171', '#94a3b8'];

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="rankpilot-card text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Your AI Branch Suitability Index</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Based on your cognitive preferences, logical foundation, and career expectations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart block */}
          <div className="md:col-span-2 rankpilot-card space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Match Percentage</h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis dataKey="branch" type="category" stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#11131d', border: '1px solid #1e2235', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#60a5fa', fontSize: '11px' }}
                  />
                  <Bar dataKey="score" name="Match Score (%)" radius={[0, 6, 6, 0]} barSize={16}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center pt-2">
              <button
                onClick={resetQuiz}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#161824] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border border-slate-200/60 dark:border-slate-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>
            </div>
          </div>

          {/* Reasoning box */}
          <div className="rankpilot-card space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500" />
              <span>Matching Insights</span>
            </h4>
            <div className="space-y-4 overflow-y-auto max-h-[320px] pr-1">
              {chartData.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-[#161824] rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{item.branch}</span>
                    <span className="text-[10px] font-extrabold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{item.score}% Match</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {results.reasoning[item.branch]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentStep];
  const percentProgress = Math.round((currentStep / QUESTIONS.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Questionnaire Card */}
      <div className="rankpilot-card p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Step indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Step {currentStep + 1} of {QUESTIONS.length}</span>
              <h3 className="font-bold text-sm sm:text-base">Branch Suitability Assessment</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">{percentProgress}% Complete</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
            style={{ width: `${percentProgress}%` }}
          />
        </div>

        {/* Question bubble */}
        <div className="p-5 bg-slate-50 dark:bg-[#161824] rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3 min-h-[140px] flex flex-col justify-center">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                {q.question}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                {q.description}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(true)}
            disabled={isSubmitting}
            className="w-full py-4.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
          >
            <span>Yes, absolutely</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={isSubmitting}
            className="w-full py-4.5 rounded-2xl bg-slate-100 dark:bg-[#161824] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center active:scale-95 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-800 disabled:opacity-50"
          >
            <span>No, not really</span>
          </button>
        </div>
      </div>
    </div>
  );
}
