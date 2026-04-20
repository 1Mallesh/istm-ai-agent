import { clsx } from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

const variants = {
  success: 'bg-emerald-900/60 text-emerald-300 border border-emerald-800/50',
  error: 'bg-red-900/60 text-red-300 border border-red-800/50',
  warning: 'bg-amber-900/60 text-amber-300 border border-amber-800/50',
  info: 'bg-blue-900/60 text-blue-300 border border-blue-800/50',
  default: 'bg-slate-800 text-slate-300 border border-slate-700',
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', variants[variant])}>
      {label}
    </span>
  );
}
