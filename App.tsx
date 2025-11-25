import React, { useState, useEffect, useRef } from 'react';
import { Trade, TradeType, TradeStatus } from './types';
import { Dashboard } from './components/Dashboard';
import { TradeList } from './components/TradeList';
import { TradeForm } from './components/TradeForm';
import { Checklist } from './components/Checklist';
import { Statistics } from './components/Statistics';

// --- MOCK DATA FOR INITIAL LOAD ---
const MOCK_TRADES: Trade[] = [
  { id: '1', ticker: 'TSLA', entryDate: '2023-10-01', exitDate: '2023-10-02', type: TradeType.LONG, bias: 'Bullish', entryPrice: 240, stopLoss: 235, exitPrice: 255, quantity: 10, fees: 5, setup: 'Gap Fill', poi: 'Daily Open', target: '260', notes: 'Strong momentum at open', pnl: 145, pnlPercentage: 6.25, rMultiple: 3.0, status: TradeStatus.WIN },
  { id: '2', ticker: 'NVDA', entryDate: '2023-10-03', exitDate: '2023-10-03', type: TradeType.SHORT, bias: 'Bearish', entryPrice: 450, stopLoss: 455, exitPrice: 455, quantity: 5, fees: 5, setup: 'Rejection', poi: 'Supply Zone', target: '440', notes: 'Stopped out too early', pnl: -30, pnlPercentage: -1.1, rMultiple: -1.0, status: TradeStatus.LOSS },
  { id: '3', ticker: 'BTC', entryDate: '2023-10-05', exitDate: '2023-10-06', type: TradeType.LONG, bias: 'Bullish', entryPrice: 27500, stopLoss: 27000, exitPrice: 28100, quantity: 0.1, fees: 10, setup: 'Trendline Bounce', poi: '200 EMA', target: '28500', notes: 'Perfect execution', pnl: 50, pnlPercentage: 2.18, rMultiple: 1.2, status: TradeStatus.WIN },
  { id: '4', ticker: 'AAPL', entryDate: '2023-10-08', exitDate: '2023-10-08', type: TradeType.LONG, bias: 'Bullish', entryPrice: 175, stopLoss: 173, exitPrice: 172, quantity: 20, fees: 5, setup: 'Breakout', poi: 'Pre-market High', target: '180', notes: 'False breakout', pnl: -65, pnlPercentage: -1.7, rMultiple: -1.5, status: TradeStatus.LOSS },
  { id: '5', ticker: 'AMD', entryDate: '2023-10-10', exitDate: '2023-10-12', type: TradeType.LONG, bias: 'Bullish', entryPrice: 105, stopLoss: 102, exitPrice: 115, quantity: 15, fees: 5, setup: 'Earnings Play', poi: 'Volume Support', target: '120', notes: 'Held through volatility', pnl: 145, pnlPercentage: 9.5, rMultiple: 3.33, status: TradeStatus.WIN },
];

const App: React.FC = () => {
  // Load trades from local storage or use mock
  const [trades, setTrades] = useState<Trade[]>(() => {
    const saved = localStorage.getItem('tradePulse_trades');
    return saved ? JSON.parse(saved) : MOCK_TRADES;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'checklist' | 'statistics'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('tradePulse_trades', JSON.stringify(trades));
  }, [trades]);

  const handleAddTrade = (tradeData: Omit<Trade, 'id' | 'status'>) => {
    // tradeData now includes pnl, pnlPercentage, and rMultiple calculated by the form
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now().toString(),
      status: tradeData.pnl > 0 ? TradeStatus.WIN : tradeData.pnl < 0 ? TradeStatus.LOSS : TradeStatus.BREAK_EVEN,
    };

    setTrades(prev => [...prev, newTrade]);
    setIsModalOpen(false);
  };

  const handleDeleteTrade = (id: string) => {
    if(window.confirm('Are you sure you want to delete this trade?')) {
        setTrades(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- DATA MANAGEMENT FUNCTIONS ---
  const handleExportData = () => {
    const dataStr = JSON.stringify(trades, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chaouch_capital_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // CSV Parsing Helper
  const parseCSV = (csvText: string): Trade[] => {
    const lines = csvText.split(/\r\n|\n/);
    if (lines.length < 2) return [];

    // Parse Headers
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Find column indexes based on common keywords
    const getIndex = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k)));

    const idx = {
        ticker: getIndex(['ticker', 'symbol', 'pair', 'instrument']),
        type: getIndex(['type', 'direction', 'side']),
        entryDate: getIndex(['entry date', 'open date', 'date', 'time']),
        exitDate: getIndex(['exit date', 'close date']),
        entryPrice: getIndex(['entry price', 'entry', 'open price']),
        exitPrice: getIndex(['exit price', 'exit', 'close price']),
        quantity: getIndex(['quantity', 'qty', 'size', 'volume']),
        pnl: getIndex(['pnl', 'profit', 'loss', 'net', 'p&l']),
        setup: getIndex(['setup', 'strategy', 'system']),
        notes: getIndex(['notes', 'comment', 'description']),
        bias: getIndex(['bias']),
        poi: getIndex(['poi', 'interest']),
        target: getIndex(['target', 'take profit']),
        fees: getIndex(['fee', 'commission'])
    };

    const newTrades: Trade[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by comma, respecting quotes
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));

        if (values.length < 2) continue; // Skip empty/malformed rows

        // Extract Data
        const ticker = idx.ticker > -1 ? values[idx.ticker] : 'UNKNOWN';
        const typeStr = idx.type > -1 ? values[idx.type].toLowerCase() : 'long';
        const type = typeStr.includes('short') ? TradeType.SHORT : TradeType.LONG;
        
        const pnl = idx.pnl > -1 ? parseFloat(values[idx.pnl].replace(/[^0-9.-]/g, '')) || 0 : 0;
        const entryPrice = idx.entryPrice > -1 ? parseFloat(values[idx.entryPrice].replace(/[^0-9.-]/g, '')) || 0 : 0;
        const exitPrice = idx.exitPrice > -1 ? parseFloat(values[idx.exitPrice].replace(/[^0-9.-]/g, '')) || 0 : 0;
        const quantity = idx.quantity > -1 ? parseFloat(values[idx.quantity].replace(/[^0-9.-]/g, '')) || 0 : 0;
        const fees = idx.fees > -1 ? parseFloat(values[idx.fees].replace(/[^0-9.-]/g, '')) || 0 : 0;

        const setup = idx.setup > -1 ? values[idx.setup] : '';
        const notes = idx.notes > -1 ? values[idx.notes] : '';
        const poi = idx.poi > -1 ? values[idx.poi] : '';
        const target = idx.target > -1 ? values[idx.target] : '';
        
        let bias: 'Bullish' | 'Bearish' | undefined = undefined;
        if (idx.bias > -1) {
            const b = values[idx.bias].toLowerCase();
            if (b.includes('bull')) bias = 'Bullish';
            if (b.includes('bear')) bias = 'Bearish';
        }

        // Handle Dates
        const now = new Date().toISOString();
        let entryDate = now;
        let exitDate = now;

        const parseDate = (dStr: string) => {
            const d = new Date(dStr);
            return isNaN(d.getTime()) ? now : d.toISOString();
        };
        
        if (idx.entryDate > -1 && values[idx.entryDate]) entryDate = parseDate(values[idx.entryDate]);
        if (idx.exitDate > -1 && values[idx.exitDate]) exitDate = parseDate(values[idx.exitDate]);
        else if (idx.entryDate > -1) exitDate = entryDate; // Fallback exit date to entry date

        // Calculate Metrics
        let pnlPercentage = 0;
        if (entryPrice > 0) {
             const multiplier = type === TradeType.LONG ? 1 : -1;
             pnlPercentage = ((exitPrice - entryPrice) / entryPrice) * 100 * multiplier;
        }

        newTrades.push({
            id: Date.now() + Math.random().toString(),
            ticker: ticker.toUpperCase(),
            type,
            entryDate,
            exitDate,
            entryPrice,
            exitPrice,
            quantity,
            pnl,
            pnlPercentage,
            fees,
            notes,
            setup,
            status: pnl > 0 ? TradeStatus.WIN : pnl < 0 ? TradeStatus.LOSS : TradeStatus.BREAK_EVEN,
            bias,
            poi,
            target
        });
    }
    return newTrades;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        
        let parsedTrades: Trade[] = [];

        if (isCSV) {
            parsedTrades = parseCSV(result);
            if (parsedTrades.length === 0) {
                alert('Could not parse any trades from CSV. Please check column headers (Ticker, PnL, Date, etc).');
                return;
            }
        } else {
            // Assume JSON
            const json = JSON.parse(result);
            if (Array.isArray(json)) {
                parsedTrades = json;
            } else {
                alert('Invalid JSON format.');
                return;
            }
        }

        const confirmMsg = isCSV 
            ? `Successfully parsed ${parsedTrades.length} trades from CSV.\n\nDo you want to append these to your existing journal (OK) or replace it (Cancel)?\n\nClick OK to Append.\nClick Cancel to Replace (Overwrite).`
            : `Found ${parsedTrades.length} trades in backup. This will overwrite your current journal. Continue?`;

        if (isCSV) {
            // Special logic for CSV import: allow append or replace
            // using a simple window.confirm is tricky for 3 states.
            // Let's simplified: Append by default? Or Replace?
            // Usually imports are appends. Backups are replaces.
            if (window.confirm(`Parsed ${parsedTrades.length} trades.\n\nClick OK to ADD them to your current list.\nClick Cancel to ABORT.`)) {
                setTrades(prev => [...prev, ...parsedTrades]);
                alert('Trades imported successfully!');
            }
        } else {
            // JSON Backup Restore (Standard Replace)
             if (window.confirm(confirmMsg)) {
                setTrades(parsedTrades);
                alert('Data restored successfully!');
             }
        }

      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error reading file. Please ensure it is a valid CSV or JSON file.');
      }
    };
    
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleResetData = () => {
      if (window.confirm('WARNING: This will delete ALL your trades. This action cannot be undone. Are you sure?')) {
          setTrades([]);
          localStorage.removeItem('tradePulse_trades');
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json, .csv"
        className="hidden" 
      />

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-white hidden md:block">Chaouch Capital</span>
              <span className="font-bold text-xl tracking-tight text-white md:hidden">CC</span>
            </div>
            
            <div className="flex items-center gap-3">
               {/* Data Management Buttons */}
               <div className="hidden md:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 mr-2">
                  <button 
                    onClick={handleImportClick}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                    title="Import Data (JSON Backup or CSV from Sheets)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  </button>
                  <button 
                    onClick={handleExportData}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                    title="Export Backup (JSON)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </button>
                  <div className="w-px h-4 bg-slate-700 mx-1"></div>
                  <button 
                    onClick={handleResetData}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-md transition-colors"
                    title="Reset All Data"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
               </div>

              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-900/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span className="hidden sm:inline">Add Trade</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('journal')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'journal' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Journal Entries
          </button>
           <button 
             onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'statistics' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Statistics
          </button>
           <button 
             onClick={() => setActiveTab('checklist')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'checklist' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            Checklist & Routine
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && <Dashboard trades={trades} />}
          {activeTab === 'journal' && <TradeList trades={trades} onDelete={handleDeleteTrade} />}
          {activeTab === 'statistics' && <Statistics trades={trades} />}
          {activeTab === 'checklist' && <Checklist />}
        </div>

      </main>

      {/* Modal */}
      {isModalOpen && (
        <TradeForm onSave={handleAddTrade} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

export default App;