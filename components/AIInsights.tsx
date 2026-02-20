
import React, { useState, useEffect } from 'react';
import { AppData, UserRole } from '../types';
import { getAIInsights } from '../services/geminiService';
import { Sparkles, Bot, ArrowRight, RefreshCw, Activity } from 'lucide-react';

interface InsightData {
  summary: string;
  risks: string[];
  advice: string[];
}

// Fixed: Added userRole to props to match usage in App.tsx
export const AIInsights: React.FC<{ data: AppData; userRole: UserRole }> = ({ data, userRole }) => {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const result = await getAIInsights(data);
    setInsights(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Calculate generic collection percentage for the ring
  const totalDue = data.members.length * data.config.fixedMonthlyCollection;
  const collected = data.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
  const percentage = Math.min(100, (collected / (totalDue || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      {/* Vital Circle Insight Card */}
      <div className="vital-card p-12 flex flex-col items-center text-center">
        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-12">Jun 2024 - Jun 2025</p>
        
        <div className="relative w-72 h-72 mb-12">
           {/* Circular Progress Ring */}
           <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="transparent" stroke="#D4FF00" strokeWidth="8" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * percentage / 100)} strokeLinecap="round" />
           </svg>
           
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="p-3 bg-slate-50 rounded-2xl mb-4">
                 <Activity className="w-6 h-6 text-obsidian" />
              </div>
              <p className="text-4xl font-black text-obsidian tracking-tighter">₹{collected.toLocaleString()}</p>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tight">Total Yield</p>
           </div>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-full mb-12">
            {['Week', 'Month', 'Year'].map(t => (
              <button key={t} className={`px-8 py-3 rounded-full text-xs font-black transition-all ${t === 'Year' ? 'bg-obsidian text-white' : 'text-slate-400'}`}>
                {t}
              </button>
            ))}
        </div>

        <div className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
           <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                 <Sparkles className="w-5 h-5 text-obsidian" />
              </div>
              <span className="text-sm font-black text-obsidian tracking-tight">Chit performance index</span>
           </div>
           <span className="text-lg font-black text-obsidian">+{Math.round(percentage)}%</span>
        </div>
      </div>

      {/* AI Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="vital-card p-10 md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-obsidian tracking-tighter italic uppercase">AI Analysis</h3>
              <button onClick={fetchInsights} disabled={loading} className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-slate-50 rounded-full w-full animate-pulse"></div>
                <div className="h-4 bg-slate-50 rounded-full w-2/3 animate-pulse"></div>
              </div>
            ) : (
              <p className="text-lg font-bold text-slate-500 italic leading-relaxed">
                "{insights?.summary || "Analyzing your fund's collection patterns..."}"
              </p>
            )}
         </div>
      </div>
    </div>
  );
};
