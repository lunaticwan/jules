import React from 'react';
import { cn } from './Button';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, highlighted, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-slate-800/80 p-4 text-slate-100 shadow-md backdrop-blur-sm transition-all',
          highlighted ? 'border-amber-500/80 ring-2 ring-amber-500/30' : 'border-slate-700/60',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
