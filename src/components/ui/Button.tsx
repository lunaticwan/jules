import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
      outline: 'border border-slate-700 hover:bg-slate-800 text-slate-300',
      ghost: 'hover:bg-slate-800 text-slate-300',
      danger: 'bg-red-600 hover:bg-red-500 text-white',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 h-8',
      md: 'text-sm px-4 py-2 h-10',
      lg: 'text-base px-5 py-2.5 h-12',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
