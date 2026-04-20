import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
}

const colorMap = {
  blue: 'bg-blue-900/50 text-blue-400',
  green: 'bg-emerald-900/50 text-emerald-400',
  red: 'bg-red-900/50 text-red-400',
  amber: 'bg-amber-900/50 text-amber-400',
  purple: 'bg-purple-900/50 text-purple-400',
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <p className={clsx('text-xs mt-2', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
      <div className={clsx('p-3 rounded-xl', colorMap[color])}>
        <Icon size={22} />
      </div>
    </div>
  );
}
