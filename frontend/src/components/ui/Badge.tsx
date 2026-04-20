import { clsx } from 'clsx';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
}

const variants = {
  success: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  error: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800',
  warning: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  info: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  default: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', variants[variant])}>
      {label}
    </span>
  );
}
