import React from 'react';
import { cn } from './Button';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent', className)}
      {...props}
    >
      {children}
    </div>
  );
};
