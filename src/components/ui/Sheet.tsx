import React from 'react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Sheet: React.FC<SheetProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-h-[90vh] rounded-t-2xl border-t border-slate-700 bg-slate-900 p-5 shadow-2xl flex flex-col overflow-hidden safe-pb">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-700" />
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">{children}</div>
      </div>
    </div>
  );
};
