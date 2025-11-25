import React, { useMemo } from 'react';
import { Trade, TradeStatus } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from 'recharts';

interface StatisticsProps {
  trades: Trade[];
}

interface GroupStats {
  label: string;
  count: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  [key: string]: any;
}

export const Statistics: React.FC<StatisticsProps> = ({ trades }) => {
  
  // --- HELPER FUNCTION FOR AGGREGATION ---
  const calculateStats = (keySelector: (t: Trade) => string | undefined): GroupStats[] => {
    const groups: Record<string, GroupStats> = {};

    trades.forEach(trade => {
      const label = keySelector(trade) || 'Unspecified';
      if (!groups[label]) {
        groups[label] = { label, count: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 };
      }
      
      const g = groups[label];
      g.count += 1;
      g.pnl += trade.pnl;
      
      if (trade.pnl > 0) g.wins += 1;
      else if (trade.pnl <= 0) g.losses += 1;
    });

    return Object.values(groups).map(g => ({
      ...g,
      winRate: g.count > 0 ? (g.wins / g.count) * 100 : 0
    })).sort((a, b) => b.pnl - a.pnl); // Default sort by PnL
  };

  // --- DERIVED STATS ---
  const setupStats = useMemo(() => calculateStats(t => t.setup), [trades]);
  const biasStats = useMemo(() => calculateStats(t => t.bias), [trades]);
  const typeStats = useMemo(() => calculateStats(t => t.type), [trades]);
  const poiStats = useMemo(() => calculateStats(t => t.poi), [trades]);
  const targetStats = useMemo(() => calculateStats(t => t.target), [trades]);

  // --- COMBINATION STATS (The "Holy Grail" Finder) ---
  const combinationStats = useMemo(() => {
     return calculateStats(t => {
         const parts = [];
         if(t.setup) parts.push(t.setup);
         if(t.bias) parts.push(t.bias);
         if(t.type) parts.push(t.type);
         return parts.length > 0 ? parts.join(' + ') : 'No Data';
     }).filter(g => g.count >= 2); // Only show combos with at least 2 trades to be significant
  }, [trades]);


  // --- CHART COLORS ---
  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];
  const PIE_COLORS_WIN = ['#10b981', '#334155']; // Green / Slate
  const PIE_COLORS_BIAS = ['#10b981', '#f43f5e', '#cbd5e1']; // Bull / Bear / Neutral

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);


  if (trades.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 border border-dashed border-slate-700 rounded-xl">
        <p>No trades available to analyze. Add trades to unlock statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* SECTION 1: VISUAL OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Setup Performance Chart */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                Setup Performance (Win Rate %)
            </h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={setupStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                    <YAxis 
                      dataKey="label" 
                      type="category" 
                      width={150} 
                      tick={{fill: '#cbd5e1', fontSize: 12}} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                        cursor={{fill: '#334155', opacity: 0.2}}
                        contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                    />
                    <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                        {setupStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.winRate >= 50 ? '#10b981' : '#f43f5e'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Direction & Bias Distribution */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
             <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
                Market Bias & Direction
            </h3>
            <div className="flex flex-col sm:flex-row justify-around items-center h-[300px]">
                {/* Bias Pie */}
                <div className="h-full w-1/2 min-w-[200px] relative">
                    <p className="text-center text-sm font-medium text-slate-400 mb-2">Bias Distribution</p>
                    <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                            <Pie
                                data={biasStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="count"
                            >
                                {biasStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.label === 'Bullish' ? '#10b981' : entry.label === 'Bearish' ? '#f43f5e' : '#64748b'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Type Pie */}
                <div className="h-full w-1/2 min-w-[200px] relative">
                    <p className="text-center text-sm font-medium text-slate-400 mb-2">Trade Type</p>
                    <ResponsiveContainer width="100%" height="80%">
                         <PieChart>
                            <Pie
                                data={typeStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="count"
                            >
                                {typeStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.label === 'Long' ? '#10b981' : '#f43f5e'} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>
      </div>

      {/* SECTION 2: COMBINATIONS TABLE (HOLY GRAIL FINDER) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
             <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-yellow-400">🏆</span> Top Performing Combinations
             </h3>
             <p className="text-sm text-slate-400 mt-1">
                 Combinations of Setup, Bias, and Direction with at least 2 occurrences.
             </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase">
                    <tr>
                        <th className="p-4">Combination Strategy</th>
                        <th className="p-4 text-center">Volume</th>
                        <th className="p-4 text-center">Win Rate</th>
                        <th className="p-4 text-right">Net P&L</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {combinationStats.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-500">Not enough data to calculate meaningful combinations yet.</td>
                        </tr>
                    )}
                    {combinationStats.slice(0, 5).map((stat, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                            <td className="p-4 font-medium text-white">{stat.label}</td>
                            <td className="p-4 text-center text-slate-300">{stat.count}</td>
                            <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    stat.winRate >= 60 ? 'bg-emerald-500/10 text-emerald-400' :
                                    stat.winRate >= 40 ? 'bg-indigo-500/10 text-indigo-400' :
                                    'bg-rose-500/10 text-rose-400'
                                }`}>
                                    {stat.winRate.toFixed(1)}%
                                </span>
                            </td>
                            <td className={`p-4 text-right font-mono font-medium ${stat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(stat.pnl)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>


      {/* SECTION 3: DETAILED ELEMENT BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* POI Stats Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                <h4 className="font-semibold text-slate-200">Point of Interest (POI) Analytics</h4>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 bg-slate-900/30">
                            <th className="p-3 text-left">POI</th>
                            <th className="p-3 text-right">WR %</th>
                            <th className="p-3 text-right">P&L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {poiStats.slice(0, 10).map((stat, i) => (
                            <tr key={i} className="hover:bg-slate-700/20">
                                <td className="p-3 text-slate-300">{stat.label}</td>
                                <td className={`p-3 text-right font-medium ${stat.winRate > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stat.winRate.toFixed(0)}%
                                </td>
                                <td className={`p-3 text-right ${stat.pnl >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                                    {formatCurrency(stat.pnl)}
                                </td>
                            </tr>
                        ))}
                         {poiStats.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">No POI data</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Target Stats Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80">
                <h4 className="font-semibold text-slate-200">Target Accuracy Analytics</h4>
            </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-xs text-slate-500 bg-slate-900/30">
                            <th className="p-3 text-left">Target Type</th>
                             <th className="p-3 text-right">WR %</th>
                            <th className="p-3 text-right">P&L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {targetStats.slice(0, 10).map((stat, i) => (
                             <tr key={i} className="hover:bg-slate-700/20">
                                <td className="p-3 text-slate-300">{stat.label}</td>
                                <td className={`p-3 text-right font-medium ${stat.winRate > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {stat.winRate.toFixed(0)}%
                                </td>
                                <td className={`p-3 text-right ${stat.pnl >= 0 ? 'text-slate-200' : 'text-rose-400'}`}>
                                    {formatCurrency(stat.pnl)}
                                </td>
                            </tr>
                        ))}
                         {targetStats.length === 0 && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">No Target data</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

    </div>
  );
};