import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../api/client';
import { MessageSquare, Send, Sparkles, AlertCircle, Bookmark, Compass } from 'lucide-react';

interface Message {
  sender: 'student' | 'mentor';
  text: string;
  citations?: string[];
  timestamp: Date;
}

export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'mentor',
      text: "Hello! I am your AI Counselling Mentor. I am equipped with the complete KEA rules, reservation quotas, and historical cutoffs. Ask me anything like 'What is SNQ Quota?', 'Which is better: CSE or AIML?', or 'How should I order my options?'",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) setInput('');
    setMessages(prev => [...prev, { sender: 'student', text, timestamp: new Date() }]);
    setIsLoading(true);

    try {
      const response = await apiClient.post('/mentor/chat', { question: text });
      setMessages(prev => [...prev, {
        sender: 'mentor',
        text: response.data.answer,
        citations: response.data.citations,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'mentor',
        text: "Sorry, I had trouble connecting to the AI knowledge base. Please try asking again in a moment.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto h-[600px] sm:h-[700px] animate-fadeIn">
      {/* RAG Chat Main Panel */}
      <div className="lg:col-span-2 rankpilot-card p-0 flex flex-col overflow-hidden shadow-xl border border-slate-200/80 dark:border-slate-800">
        {/* Panel Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161824]/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">KEA Admissions Mentor</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Augmented with official KEA Counselling files</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>RAG Active</span>
          </span>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-[#0b0c13]/30 min-h-[300px]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'student' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm ${
                  msg.sender === 'student'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-[#161824] border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}

                {/* Citations block */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] text-slate-400 font-semibold space-y-1">
                    <span className="flex items-center gap-1 text-slate-500 uppercase tracking-wider">
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Citations ({msg.citations.length})</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {msg.citations.map((c, cIdx) => (
                        <li key={cIdx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 font-bold font-mono mt-1 px-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 italic text-xs px-2 animate-pulse">
              <LoaderIcon className="animate-spin text-blue-500" />
              <span>Mentor is analyzing guidelines and formulating response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#11131d]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about SNQ quota, choice entry rules, CSE vs AIML..."
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-[#161824] border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Suggested Prompt Sidebar */}
      <div className="space-y-4 flex flex-col">
        <div className="rankpilot-card space-y-4 border border-slate-200/80 dark:border-slate-800 flex-1">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-500" />
            <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-400">Suggested Topics</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click on any common student query below to get instant guidelines with official citations.
          </p>

          <div className="flex flex-col gap-2">
            {[
              "What is SNQ quota & eligibility?",
              "How to sequence choices in option entry?",
              "Should I choose CSE or AIML?",
              "What are Choice 1, 2, 3, 4 rules?",
              "What happens in the Mock Round?"
            ].map((prompt, pIdx) => (
              <button
                key={pIdx}
                onClick={() => handleSuggestion(prompt)}
                disabled={isLoading}
                className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-[#161824] hover:bg-blue-500/10 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 text-xs font-semibold transition-all cursor-pointer truncate"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="rankpilot-card bg-slate-100/50 dark:bg-[#161824] border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-bold text-xs">RAG Citation Policy</h5>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
              Answers are cross-referenced with verified KEA manuals. However, students should double-check dates and announcements directly on kea.kar.nic.in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg
    className={`animate-spin h-4 w-4 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
