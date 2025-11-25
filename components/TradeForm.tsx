import React, { useState } from 'react';
import { Trade, TradeType } from '../types';

interface TradeFormProps {
  onSave: (trade: Omit<Trade, 'id' | 'status'>) => void;
  onClose: () => void;
}

export const TradeForm: React.FC<TradeFormProps> = ({ onSave, onClose }) => {
  const [mode, setMode] = useState<'detailed' | 'quick'>('detailed');

  // Common Fields
  const [ticker, setTicker] = useState('NQ');
  const [type, setType] = useState<TradeType>(TradeType.LONG);
  const [bias, setBias] = useState<'Bearish' | 'Bullish'>('Bullish');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [exitDate, setExitDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Strategy Fields
  const [setup, setSetup] = useState('');
  const [poi, setPoi] = useState('');
  const [target, setTarget] = useState('');
  const [notes, setNotes] = useState('');
  
  // Detailed Mode Fields
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [fees, setFees] = useState('0');

  // Quick Mode Fields
  const [quickQuantity, setQuickQuantity] = useState('');
  const [netPnl, setNetPnl] = useState('');
  const [riskAmount, setRiskAmount] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalEntryPrice = 0;
    let finalStopLoss = 0;
    let finalExitPrice = 0;
    let finalQuantity = 0;
    let finalFees = Number(fees);
    let finalPnl = 0;
    let finalPnlPercentage = 0;
    let finalInitialRisk = 0;
    let finalRMultiple = 0;

    if (mode === 'detailed') {
      finalEntryPrice = Number(entryPrice);
      finalStopLoss = Number(stopLoss);
      finalExitPrice = Number(exitPrice);
      finalQuantity = Number(quantity);
      
      const multiplier = type === TradeType.LONG ? 1 : -1;
      const grossPnl = (finalExitPrice - finalEntryPrice) * finalQuantity * multiplier;
      finalPnl = grossPnl - finalFees;
      finalPnlPercentage = ((finalExitPrice - finalEntryPrice) / finalEntryPrice) * 100 * multiplier;

      // Calculate R-Multiple based on price action
      if (finalStopLoss > 0) {
        const riskPerShare = Math.abs(finalEntryPrice - finalStopLoss);
        finalInitialRisk = riskPerShare * finalQuantity;

        let priceDiff = 0;
        let riskDiff = 0;

        if (type === TradeType.LONG) {
             priceDiff = finalExitPrice - finalEntryPrice;
             riskDiff = finalEntryPrice - finalStopLoss;
        } else {
             priceDiff = finalEntryPrice - finalExitPrice;
             riskDiff = finalStopLoss - finalEntryPrice;
        }

        if (riskDiff > 0) {
            finalRMultiple = priceDiff / riskDiff;
        }
      }

    } else {
      // Quick Mode Logic
      // In this mode, we treat the input as quantity (contracts), not dollar value.
      finalQuantity = Number(quickQuantity);
      finalPnl = Number(netPnl);
      finalFees = Number(fees);
      finalInitialRisk = Number(riskAmount);
      
      // Since we don't have price data, we set these to 0.
      // The TradeList component handles display of 0 values gracefully.
      finalEntryPrice = 0;
      finalExitPrice = 0;
      finalPnlPercentage = 0; 
      finalStopLoss = 0;

      // Calculate R based on explicit risk amount if provided
      if (finalInitialRisk > 0) {
          finalRMultiple = finalPnl / finalInitialRisk;
      }
    }

    onSave({
      ticker: ticker.toUpperCase(),
      entryDate,
      exitDate,
      type,
      bias,
      entryPrice: finalEntryPrice,
      stopLoss: finalStopLoss > 0 ? finalStopLoss : undefined,
      exitPrice: finalExitPrice,
      quantity: finalQuantity,
      fees: finalFees,
      setup,
      poi,
      target,
      initialRisk: finalInitialRisk > 0 ? finalInitialRisk : undefined,
      rMultiple: finalRMultiple !== 0 ? Number(finalRMultiple.toFixed(2)) : undefined,
      notes,
      pnl: finalPnl,
      pnlPercentage: finalPnlPercentage,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white">Log New Trade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setMode('detailed')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'detailed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Detailed Entry
            </button>
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'quick' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Quick Log
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Fields */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Ticker Symbol</label>
              <input 
                required
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="NQ" 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase font-mono" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Direction</label>
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button 
                    type="button"
                    onClick={() => setType(TradeType.LONG)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${type === TradeType.LONG ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Long
                  </button>
                  <button 
                    type="button"
                    onClick={() => setType(TradeType.SHORT)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${type === TradeType.SHORT ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Short
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Bias</label>
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                  <button 
                    type="button"
                    onClick={() => setBias('Bullish')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${bias === 'Bullish' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Bull
                  </button>
                  <button 
                    type="button"
                    onClick={() => setBias('Bearish')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${bias === 'Bearish' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Bear
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Fields */}
            {mode === 'detailed' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Entry Price</label>
                  <input 
                    required
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Stop Loss</label>
                  <input 
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="Optional (for R calc)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Exit Price</label>
                  <input 
                    required
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Quantity</label>
                  <input 
                    required
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Quantity</label>
                  <input 
                    required
                    type="number"
                    step="any"
                    value={quickQuantity}
                    onChange={(e) => setQuickQuantity(e.target.value)}
                    placeholder="Num. Contracts/Shares"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Initial Risk ($)</label>
                  <input 
                    type="number"
                    step="any"
                    value={riskAmount}
                    onChange={(e) => setRiskAmount(e.target.value)}
                    placeholder="Amount risked (for R)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Net P&L ($)</label>
                  <input 
                    required
                    type="number"
                    step="any"
                    value={netPnl}
                    onChange={(e) => setNetPnl(e.target.value)}
                    placeholder="Total Profit/Loss"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
                  />
                </div>
                <div className="hidden md:block"></div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Fees/Commissions</label>
              <input 
                type="number"
                step="any"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono" 
              />
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Entry Date</label>
              <input 
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Exit Date</label>
              <input 
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Setup Strategy</label>
              <input 
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                placeholder="e.g. Breakout"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">POI (Point of Interest)</label>
              <input 
                value={poi}
                onChange={(e) => setPoi(e.target.value)}
                placeholder="e.g. 4H Order Block"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Target</label>
              <input 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. Previous High"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Notes & Analysis</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How did you feel? Did you follow your plan?"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-900/30"
            >
              Add Trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
