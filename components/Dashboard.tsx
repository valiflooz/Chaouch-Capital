import React, { useState, useMemo } from 'react';
import { Trade, DashboardStats } from '../types';
import { MetricsCard } from './MetricsCard';
import { CalendarStats } from './CalendarStats';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ReferenceLine 
} from 'recharts';

interface DashboardProps {
  trades: Trade[];
}

type FilterType = 'ALL' | '7D' | '30D' | 'MTD' | 'YTD' | 'CUSTOM';

export const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [customDate, setCustomDate] = useState<string>('');

  // --- FILTERING LOGIC ---
  const filteredTrades = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (filterType) {
      case '7D':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '30D':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'MTD': // Month to Date
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'YTD': // Year to Date
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'CUSTOM':
        if (customDate) {
          startDate = new Date(customDate);
        }
        break;
      case 'ALL':
      default:
        startDate = null;
    }

    if (!startDate) return trades;

    // Reset time part for accurate comparison
    startDate.setHours(0, 0, 0, 0);

    return trades.filter(t => {
      // Use exitDate for PnL realization
      const tradeDate = new Date(t.exitDate); 
      return tradeDate >= startDate!;
    });
  }, [trades, filterType, customDate]);


  // --- STATS CALCULATION ---
  const stats: DashboardStats = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const wins = filteredTrades.filter(t => t.pnl > 0);
    const losses = filteredTrades.filter(t => t.pnl <= 0);
    const totalPnL = filteredTrades.reduce((acc, t) => acc + t.pnl, 0);
    const totalWinPnl = wins.reduce((acc, t) => acc + t.pnl, 0);
    const totalLossPnl = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));

    return {
      totalTrades,
      winRate: totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0,
      totalPnL,
      avgWin: wins.length > 0 ? totalWinPnl / wins.length : 0,
      avgLoss: losses.length > 0 ? losses.reduce((acc, t) => acc + t.pnl, 0) / losses.length : 0,
      profitFactor: totalLossPnl > 0 ? totalWinPnl / totalLossPnl : totalWinPnl > 0 ? 999 : 0,
      bestTrade: Math.max(...filteredTrades.map(t => t.pnl), 0),
      worstTrade: Math.min(...filteredTrades.map(t => t.pnl), 0),
      consecutiveWins: 0, 
      consecutiveLosses: 0,
    };
  }, [filteredTrades]);


  // --- CHART DATA PREPARATION ---
  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime());
  }, [filteredTrades]);
  
  const equityCurveData = useMemo(() => {
    let cumulativePnl = 0;
    return sortedTrades.map(t => {
      cumulativePnl += t.pnl;
      return {
        date: t.exitDate,
        equity: cumulativePnl,
        pnl: t.pnl
      };
    });
  }, [sortedTrades]);

  const pnlData = useMemo(() => {
    return sortedTrades.map(t => ({
      ...t,
      fill: t.pnl >= 0 ? '#10B981' : '#F43F5E'
    }));
  }, [sortedTrades]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      
      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
        <h2 className="text-lg font-medium text-slate-200">Performance Overview</h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-900 rounded-lg p-1 flex border border-slate-700">
             {(['ALL', '7D', '30D', 'MTD', 'YTD'] as FilterType[]).map((type) => (
               <button
                 key={type}
                 onClick={() => setFilterType(type)}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                   filterType === type 
                     ? 'bg-indigo-600 text-white shadow-sm' 
                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                 }`}
               >
                 {type === 'ALL' ? 'All Time' : type}
               </button>
             ))}
             <button
               onClick={() => setFilterType('CUSTOM')}
               className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                 filterType === 'CUSTOM' 
                   ? 'bg-indigo-600 text-white shadow-sm' 
                   : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
               }`}
             >
               Custom
             </button>
          </div>

          {filterType === 'CUSTOM' && (
             <div className="relative">
                <input 
                  type="date" 
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
             </div>
          )}
        </div>
      </div>

      {filteredTrades.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-700 rounded-xl">
           <p className="text-slate-500">No trades found for this time period.</p>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricsCard 
              title="Net P&L" 
              value={formatCurrency(stats.totalPnL)}
              trend={stats.totalPnL >= 0 ? 'up' : 'down'}
              highlight={true}
            />
            <MetricsCard 
              title="Win Rate" 
              value={`${stats.winRate.toFixed(1)}%`}
              subValue={`${stats.totalTrades} Trades`}
              trend={stats.winRate > 50 ? 'up' : 'neutral'}
            />
            <MetricsCard 
              title="Profit Factor" 
              value={stats.profitFactor.toFixed(2)}
              trend={stats.profitFactor > 1.5 ? 'up' : 'neutral'}
            />
            <MetricsCard 
              title="Avg Return" 
              value={formatCurrency(stats.totalTrades > 0 ? stats.totalPnL / stats.totalTrades : 0)}
              subValue={
                <span className="flex gap-2">
                   <span className="text-emerald-400 whitespace-nowrap">Win: {formatCurrency(stats.avgWin)}</span>
                   <span className="text-rose-400 whitespace-nowrap">Loss: {formatCurrency(stats.avgLoss)}</span>
                </span>
              }
            />
          </div>

          {/* Calendar View */}
          <div className="mb-8">
            <CalendarStats trades={trades} />
          </div>

          {/* Main Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Equity Curve */}
            <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-5 h-[400px]">
              <h3 className="text-slate-300 font-medium mb-6">Equity Curve</h3>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                  />
                  <YAxis 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}}
                    itemStyle={{color: '#818cf8'}}
                    formatter={(value: number) => [formatCurrency(value), 'Cumulative P&L']}
                    labelStyle={{color: '#cbd5e1'}}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* PnL Distribution */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 h-[400px]">
              <h3 className="text-slate-300 font-medium mb-6">Trade Distribution</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={pnlData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <ReferenceLine y={0} stroke="#475569" />
                  <Tooltip 
                    cursor={{fill: '#334155', opacity: 0.2}}
                    contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc'}}
                    formatter={(value: number) => [formatCurrency(value), 'P&L']}
                    labelFormatter={(label) => ''}
                  />
                  <XAxis hide />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {pnlData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};