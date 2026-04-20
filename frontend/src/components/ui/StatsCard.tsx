'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  loading?: boolean;
}

const colorMap = {
  blue:   { bg: 'bg-blue-900/40',   text: 'text-blue-400',   ring: 'ring-blue-700/30'  },
  green:  { bg: 'bg-emerald-900/40', text: 'text-emerald-400', ring: 'ring-emerald-700/30'},
  red:    { bg: 'bg-red-900/40',    text: 'text-red-400',    ring: 'ring-red-700/30'   },
  amber:  { bg: 'bg-amber-900/40',  text: 'text-amber-400',  ring: 'ring-amber-700/30' },
  purple: { bg: 'bg-purple-900/40', text: 'text-purple-400', ring: 'ring-purple-700/30'},
};

function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const diff = target - start;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = target;
  }, [target, duration]);

  return display;
}

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'blue', loading }: StatsCardProps) {
  const c = colorMap[color];
  const numericValue = typeof value === 'number' ? value : NaN;
  const animated = useCountUp(isNaN(numericValue) ? 0 : numericValue);
  const displayValue = loading ? null : (isNaN(numericValue) ? value : animated);

  return (
    <div className={clsx(
      'bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start justify-between gap-4',
      'hover:border-slate-700 transition-colors animate-fade-in-up',
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide truncate">{title}</p>
        <p className={clsx('text-3xl font-bold text-white mt-1.5 tabular-nums', loading && 'animate-pulse')}>
          {loading ? (
            <span className="inline-block w-12 h-8 shimmer rounded" />
          ) : (
            <span className="animate-count inline-block">{displayValue}</span>
          )}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 truncate">
            {loading ? <span className="inline-block w-20 h-3 shimmer rounded" /> : subtitle}
          </p>
        )}
        {trend && !loading && (
          <div className={clsx('flex items-center gap-1 mt-2 text-xs font-medium', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}% {trend.label}
          </div>
        )}
      </div>
      <div className={clsx('p-3 rounded-xl ring-1 shrink-0', c.bg, c.ring)}>
        <Icon size={22} className={c.text} />
      </div>
    </div>
  );
}
