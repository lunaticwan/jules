import React from 'react';
import { cn } from './Button';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border border-amber-800/60',
    danger: 'bg-rose-950/80 text-rose-400 border border-rose-800/60',
    info: 'bg-blue-950/80 text-blue-400 border border-blue-800/60',
    outline: 'border border-slate-600 text-slate-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
