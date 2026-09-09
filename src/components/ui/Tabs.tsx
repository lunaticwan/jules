import React from 'react';
import { cn } from './Button';

export interface TabsProps {
  items: { id: string; label: string; count?: number }[];
  activeId: string;
  onChange: (id: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto no-scrollbar py-1">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300'
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
