import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subValue?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, subValue, trend, icon, highlight }) => {
  return (
    <div className={`p-5 rounded-xl border transition-all duration-200 ${highlight ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/20' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className={`text-sm font-medium ${highlight ? 'text-indigo-100' : 'text-slate-400'}`}>{title}</h3>
        {icon && <div className={`${highlight ? 'text-indigo-200' : 'text-slate-500'}`}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-white'}`}>
          {value}
        </span>
        {subValue && (
          <span className={`text-xs ${
            trend === 'up' ? 'text-emerald-400' : 
            trend === 'down' ? 'text-rose-400' : 
            'text-slate-400'
          }`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};