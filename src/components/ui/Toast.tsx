import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  isOpen,
  onClose,
  duration = 2500,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
    }
  };

  const getBgStyle = () => {
    switch (type) {
      case 'error':
        return 'bg-rose-950/95 border-rose-800 text-rose-200';
      case 'info':
        return 'bg-slate-900/95 border-blue-800 text-blue-200';
      default:
        return 'bg-slate-900/95 border-emerald-800 text-emerald-200';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${getBgStyle()}`}>
        {getIcon()}
        <span>{message}</span>
        <button
          onClick={onClose}
          className="ml-2 rounded p-0.5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};
