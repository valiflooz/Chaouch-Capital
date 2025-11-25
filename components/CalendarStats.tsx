import React, { useState, useMemo } from 'react';
import { Trade } from '../types';

interface CalendarStatsProps {
  trades: Trade[];
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({ trades }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Aggregated Data for the Month
  const dailyStats = useMemo(() => {
    const stats: Record<number, { pnl: number; count: number }> = {};
    
    trades.forEach(trade => {
      const tDate = new Date(trade.exitDate); 
      if (tDate.getFullYear() === year && tDate.getMonth() === month) {
        const day = tDate.getDate();
        if (!stats[day]) {
          stats[day] = { pnl: 0, count: 0 };
        }
        stats[day].pnl += trade.pnl;
        stats[day].count += 1; 
      }
    });
    return stats;
  }, [trades, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); 
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(val);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Calendar</h2>
        
        <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="text-lg font-semibold text-slate-200 select-none min-w-[160px] text-center">
                {monthNames[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            
            <button 
                onClick={resetToToday}
                className="ml-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
                Today
            </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-xl">
          
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                {day}
            </div>
            ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
            {days.map((day, idx) => {
            // Empty Cell
            if (day === null) {
                return <div key={`empty-${idx}`} className="h-28 md:h-32 rounded-2xl bg-slate-800/20 border border-slate-800/50"></div>;
            }

            const stats = dailyStats[day];
            const hasTrades = stats && stats.count > 0;
            const isProfit = hasTrades && stats.pnl > 0;
            const isLoss = hasTrades && stats.pnl < 0; 

            // Dynamic Styles
            let containerClasses = "relative h-28 md:h-32 rounded-2xl p-4 flex flex-col justify-center transition-all duration-300 group hover:scale-[1.02] overflow-hidden";
            let pnlColor = "text-slate-300";
            
            if (isProfit) {
                // Green Gradient Style
                containerClasses += " bg-gradient-to-b from-slate-800 to-emerald-900/40 border border-emerald-500/20 shadow-lg shadow-emerald-900/10";
                pnlColor = "text-emerald-400";
            } else if (isLoss) {
                // Red Gradient Style
                containerClasses += " bg-gradient-to-b from-slate-800 to-rose-900/40 border border-rose-500/20 shadow-lg shadow-rose-900/10";
                pnlColor = "text-rose-400";
            } else {
                // Neutral Style
                containerClasses += " bg-slate-800 border border-slate-700/50 hover:border-slate-600";
            }

            return (
                <div key={day} className={containerClasses}>
                    {/* Date Number */}
                    <span className={`absolute top-3 right-4 text-xs font-medium ${hasTrades ? 'text-slate-400' : 'text-slate-600'}`}>
                        {day}
                    </span>
                    
                    {/* Content */}
                    <div className="flex flex-col items-start mt-2"> {/* Align Start (Left) per screenshot */}
                        {hasTrades ? (
                            <>
                                <div className={`text-lg md:text-xl font-bold tracking-tight mb-1 ${pnlColor}`}>
                                    {stats.pnl > 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                                </div>
                                <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <span className={isProfit ? "text-emerald-500/70" : isLoss ? "text-rose-500/70" : "text-slate-500"}>
                                       ●
                                    </span>
                                    {stats.count} {stats.count === 1 ? 'trade' : 'trades'}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-lg md:text-xl font-bold text-slate-700 mb-1 select-none">
                                    $0
                                </div>
                                <div className="text-xs text-slate-700 font-medium select-none">
                                    - trades
                                </div>
                            </>
                        )}
                    </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};