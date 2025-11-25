import React from 'react';
import { Trade, TradeType } from '../types';

interface TradeListProps {
  trades: Trade[];
  onDelete: (id: string) => void;
}

export const TradeList: React.FC<TradeListProps> = ({ trades, onDelete }) => {
  const sortedTrades = [...trades].sort((a, b) => new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime());

  if (trades.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        <p>No trades logged yet. Start your journey by adding a trade.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticker</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Bias</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Setup</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">POI</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">R</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Entry</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Exit</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">P&L ($)</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">P&L (%)</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors group">
                <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                    {new Date(trade.exitDate).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm font-bold text-white whitespace-nowrap font-mono">{trade.ticker}</td>
                <td className="p-4 text-sm whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.type === TradeType.LONG 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {trade.type}
                  </span>
                </td>
                 <td className="p-4 text-sm whitespace-nowrap">
                  {trade.bias && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.bias === 'Bullish' 
                        ? 'text-emerald-400' 
                        : 'text-rose-400'
                    }`}>
                        {trade.bias}
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-slate-400 max-w-[150px] truncate" title={trade.setup}>{trade.setup || '-'}</td>
                <td className="p-4 text-sm text-slate-400 max-w-[120px] truncate" title={trade.poi}>{trade.poi || '-'}</td>
                <td className="p-4 text-sm text-slate-400 max-w-[120px] truncate" title={trade.target}>{trade.target || '-'}</td>
                
                <td className="p-4 text-sm text-right font-mono font-medium">
                  {trade.rMultiple !== undefined ? (
                    <span className={trade.rMultiple > 0 ? 'text-emerald-400' : trade.rMultiple < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {trade.rMultiple}R
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>

                <td className="p-4 text-sm text-slate-300 text-right font-mono">
                  {trade.entryPrice > 0 ? trade.entryPrice : '-'}
                </td>
                <td className="p-4 text-sm text-slate-300 text-right font-mono">
                  {trade.exitPrice > 0 ? trade.exitPrice : '-'}
                </td>
                <td className={`p-4 text-sm font-bold text-right font-mono ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toLocaleString('en-US', {style: 'currency', currency: 'USD'})}
                </td>
                 <td className={`p-4 text-sm font-medium text-right font-mono ${trade.pnlPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trade.entryPrice > 0 ? `${trade.pnlPercentage.toFixed(2)}%` : '-'}
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => onDelete(trade.id)}
                    className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                    title="Delete Trade"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
