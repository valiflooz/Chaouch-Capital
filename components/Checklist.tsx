import React, { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

interface ChecklistGroupProps {
  title: string;
  subtitle?: string;
  storageKey: string;
  defaultItems: ChecklistItem[];
}

const ChecklistGroup: React.FC<ChecklistGroupProps> = ({ title, subtitle, storageKey, defaultItems }) => {
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : defaultItems;
  });
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    setItems([...items, { id: Date.now().toString(), text: newItemText, isCompleted: false }]);
    setNewItemText('');
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

   const resetChecklist = () => {
       if (window.confirm(`Reset all checkboxes for ${title}?`)) {
           setItems(items.map(i => ({...i, isCompleted: false})));
       }
   }

  const completed = items.filter(i => i.isCompleted).length;
  const progress = items.length > 0 ? (completed / items.length) * 100 : 0;

  return (
    <div className="space-y-6">
       <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg shadow-slate-900/50">
            <div className="flex justify-between items-center mb-4">
                 <div>
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                    {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
                 </div>
                 <button onClick={resetChecklist} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 transition-colors">
                    Reset
                 </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-grow bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs font-mono font-medium text-slate-300 min-w-[3rem] text-right">{Math.round(progress)}%</span>
            </div>
            <p className="text-right text-xs text-slate-500 mt-1">{completed}/{items.length} Tasks Completed</p>
       </div>

       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg shadow-slate-900/50">
            <div className="divide-y divide-slate-700">
                {items.length === 0 && (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        No items in this checklist. Add one below.
                    </div>
                )}
                {items.map(item => (
                    <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-700/30 group transition-colors cursor-pointer" onClick={() => toggleItem(item.id)}>
                         <button
                            className={`flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all duration-200 ${item.isCompleted ? 'bg-indigo-600 border-indigo-600' : 'border-slate-500 group-hover:border-indigo-400 bg-slate-800'}`}
                         >
                            {item.isCompleted && <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                         </button>
                         <span className={`flex-grow text-sm select-none transition-colors ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                             {item.text}
                         </span>
                         <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all p-2"
                            title="Delete Item"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                    </div>
                ))}
            </div>

            <form onSubmit={addItem} className="p-4 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder={`Add item to ${title}...`}
                    className="flex-grow bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder-slate-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newItemText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20"
                >
                    Add
                </button>
            </form>
       </div>
    </div>
  );
};

export const Checklist: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <ChecklistGroup 
        title="Daily Trading Routine" 
        subtitle="Consistency is the key to profitability."
        storageKey="tradePulse_checklist"
        defaultItems={[
            { id: '1', text: 'Check Economic Calendar for High Impact News', isCompleted: false },
            { id: '2', text: 'Review Daily/4H Market Structure', isCompleted: false },
            { id: '3', text: 'Mark Key Support & Resistance Levels', isCompleted: false },
            { id: '4', text: 'Define Risk per Trade (Max 1-2%)', isCompleted: false },
            { id: '5', text: 'Clear Mental State / No Distractions', isCompleted: false },
        ]}
      />
      <ChecklistGroup 
        title="Setup Quality" 
        subtitle="High probability setups only. Don't force trades."
        storageKey="tradePulse_setup_checklist"
        defaultItems={[
             { id: '1', text: 'Trend Alignment (HTF Direction)', isCompleted: false },
             { id: '2', text: 'Clean Liquidity Sweep / Key Level Test', isCompleted: false },
             { id: '3', text: 'Valid Entry Signal (Candlestick Pattern)', isCompleted: false },
             { id: '4', text: 'Minimum 1:2 Risk to Reward Ratio', isCompleted: false },
             { id: '5', text: 'No High Impact News During Trade Duration', isCompleted: false },
        ]}
      />
    </div>
  );
};