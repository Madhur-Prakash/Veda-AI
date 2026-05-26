import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
};

const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:pointer-events-none disabled:opacity-50';

export function Button({ className, variant = 'default', size = 'md', ...props }: ButtonProps) {
  const variants = {
    default: 'bg-ink text-white shadow-[0_10px_20px_rgba(0,0,0,0.14)] hover:bg-black',
    ghost: 'bg-transparent text-ink hover:bg-black/5',
    outline: 'border border-line bg-white text-ink hover:bg-black/[0.03]',
    soft: 'bg-[#f3f0ee] text-ink hover:bg-[#e9e4e1]'
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-6 text-base'
  };

  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}