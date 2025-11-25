import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeTrades } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Assuming we'd install this, but since I can't add pkgs, I'll render text simply or simple parse. 
// Note: ReactMarkdown is a standard lib but not guaranteed. I will write a simple renderer for safety or just display whitespace-pre-wrap.

interface AICoachProps {
  trades: Trade[];
}

export const AICoach: React.FC<AICoachProps> = ({ trades }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeTrades(trades);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">✨</span> AI Performance Coach
          </h2>
          <p className="text-slate-400 text-sm mt-1">Get personalized insights powered by Gemini 2.5 Flash</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || trades.length === 0}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            loading 
              ? 'bg-indigo-900/50 text-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/30'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Journal...
            </>
          ) : (
            <>
              Generate Report
            </>
          )}
        </button>
      </div>

      {analysis ? (
        <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
           {/* Simple markdown-like rendering for bullet points and bold text */}
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
            {analysis.split('\n').map((line, i) => {
                if (line.trim().startsWith('**')) {
                   return <p key={i} className="font-bold text-indigo-200 mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>
                }
                if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                    return <li key={i} className="ml-4 list-disc marker:text-indigo-500 pl-1 mb-1">{line.replace(/^[\*\-]\s/, '')}</li>
                }
                return <p key={i} className="mb-2">{line}</p>
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-slate-700/50 rounded-lg">
          <div className="mx-auto w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-2xl">
            📊
          </div>
          <p className="text-slate-400 font-medium">Ready to analyze your trading behavior</p>
          <p className="text-slate-500 text-sm mt-1">Add trades to your journal and tap "Generate Report"</p>
        </div>
      )}
    </div>
  );
};