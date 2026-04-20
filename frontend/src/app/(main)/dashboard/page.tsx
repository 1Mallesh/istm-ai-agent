'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatCardSkeleton, TimelineRowSkeleton } from '@/components/ui/Skeleton';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { userService } from '@/services/user.service';
import { ticketService } from '@/services/ticket.service';
import { integrationService } from '@/services/integration.service';
import { provisioningService } from '@/services/provisioning.service';
import {
  Users, Ticket, CheckCircle, AlertTriangle, Puzzle, Bot,
  Activity, RefreshCw, Clock, UserPlus, Zap, TrendingUp,
  Circle,
} from 'lucide-react';

const REFRESH_INTERVAL = 30;

/* ── tiny async hook ── */
function useAsync<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      if (mounted.current) setData(res);
    } catch (err: any) {
      if (mounted.current) setError(String(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    return () => { mounted.current = false; };
  }, [run]);

  return { data, loading, error, refetch: run };
}

/* ── countdown hook ── */
function useCountdown(seconds: number, onZero: () => void) {
  const [count, setCount] = useState(seconds);
  const cb = useRef(onZero);
  cb.current = onZero;

  useEffect(() => {
    setCount(seconds);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { cb.current(); return seconds; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return count;
}

/* ── status helpers ── */
const statusDot: Record<string, string> = {
  success: 'bg-emerald-400',
  failed: 'bg-red-400',
  in_progress: 'bg-amber-400',
  pending: 'bg-blue-400',
};
const integBadge: Record<string, string> = {
  active: 'badge-success',
  error: 'badge-error',
  inactive: 'badge-default',
  configuring: 'badge-warning',
};
const provBadge: Record<string, string> = {
  success: 'badge-success',
  failed: 'badge-error',
  in_progress: 'badge-warning',
  pending: 'badge-info',
};

/* ── onboarding timeline step icons ── */
const PROV_STEPS = ['slack', 'github', 'jira', 'zoom', 'google_workspace'];

function TimelineItem({ log }: { log: any }) {
  const isSuccess = log.status === 'success';
  const isFailed = log.status === 'failed';
  return (
    <div className="flex gap-3 py-3 border-b border-slate-800/60 last:border-0 animate-fade-in-up">
      {/* avatar */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
        isSuccess ? 'bg-emerald-900/60 text-emerald-300' :
        isFailed ? 'bg-red-900/60 text-red-300' :
        'bg-blue-900/60 text-blue-300'
      }`}>
        {log.userEmail ? log.userEmail[0].toUpperCase() : '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">
          <span className="font-medium">{log.userEmail}</span>
          <span className="text-slate-400 mx-1">·</span>
          <span className="text-slate-400 capitalize">{log.action}</span>
          <span className="text-slate-500 mx-1">via</span>
          <span className="text-blue-400">{log.provider}</span>
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">
            {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          {log.role && (
            <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded capitalize">{log.role}</span>
          )}
        </div>
      </div>
      <span className={`${provBadge[log.status] || 'badge-default'} self-start mt-1`}>
        {log.status.replace('_', ' ')}
      </span>
    </div>
  );
}

function SystemHealthRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs text-slate-400 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-300 w-8 text-right tabular-nums">{value}</span>
    </div>
  );
}

export default function DashboardPage() {
  const employees  = useAsync(() => userService.list({ limit: 1, page: 1 }));
  const ticketStats = useAsync(() => ticketService.getStats());
  const integrations = useAsync(() => integrationService.list());
  const provLogs  = useAsync(() => provisioningService.getLogs({ limit: 10, page: 1 }));

  const refetchAll = useCallback(() => {
    employees.refetch();
    ticketStats.refetch();
    integrations.refetch();
    provLogs.refetch();
  }, [employees.refetch, ticketStats.refetch, integrations.refetch, provLogs.refetch]);

  /* ── auto-refresh countdown ── */
  const countdown = useCountdown(REFRESH_INTERVAL, refetchAll);
  const countdownPct = ((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100;

  /* ── derived values ── */
  const stats          = (ticketStats.data ?? {}) as any;
  const totalEmployees = (employees.data as any)?.total ?? 0;
  const integList      = (integrations.data as any[]) ?? [];
  const activeInteg    = useMemo(() => integList.filter((i) => i.isEnabled && i.status === 'active').length, [integList]);
  const logs           = ((provLogs.data as any)?.data ?? []) as any[];

  const allLoading = employees.loading && ticketStats.loading && integrations.loading && provLogs.loading;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time ITSM operations · auto-refreshes every {REFRESH_INTERVAL}s
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Countdown ring */}
          <div className="relative h-9 w-9">
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#3b82f6" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 14}`}
                strokeDashoffset={`${2 * Math.PI * 14 * (1 - countdownPct / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-400 tabular-nums">
              {countdown}s
            </span>
          </div>
          <button
            onClick={refetchAll}
            disabled={allLoading}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={allLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error banners ── */}
      {ticketStats.error && <ErrorAlert message={`Stats: ${ticketStats.error}`} onRetry={ticketStats.refetch} />}

      {/* ── KPI row 1 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ticketStats.loading ? (
          <>
            <StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard title="Total Employees" value={totalEmployees} subtitle="Across all departments" icon={Users} color="blue" />
            <StatsCard title="Active Integrations" value={activeInteg} subtitle={`of ${integList.length} configured`} icon={Puzzle} color="green" />
            <StatsCard title="Open Tickets" value={stats.open ?? 0} subtitle={`${stats.critical ?? 0} critical`} icon={Ticket} color="amber" />
            <StatsCard title="AI Detected" value={stats.aiGenerated ?? 0} subtitle="Auto-ticketed this week" icon={Bot} color="purple" />
          </>
        )}
      </div>

      {/* ── KPI row 2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {ticketStats.loading ? (
          <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
        ) : (
          <>
            <StatsCard title="Total Tickets" value={stats.total ?? 0} subtitle="All time" icon={Ticket} color="blue" />
            <StatsCard title="Resolved" value={stats.resolved ?? 0} subtitle="Closed successfully" icon={CheckCircle} color="green" trend={{ value: 12, label: 'vs last week' }} />
            <StatsCard title="Critical Alerts" value={stats.critical ?? 0} subtitle="Require immediate action" icon={AlertTriangle} color="red" />
          </>
        )}
      </div>

      {/* ── Bottom 3-col grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Onboarding Timeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={17} className="text-blue-400" />
              <h2 className="text-base font-semibold text-white">Onboarding Timeline</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-xs text-emerald-400">live</span>
            </div>
          </div>

          {provLogs.loading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => <TimelineRowSkeleton key={i} />)}
            </div>
          ) : provLogs.error ? (
            <ErrorAlert message={provLogs.error} onRetry={provLogs.refetch} />
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserPlus size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No onboarding activity yet.</p>
              <a href="/employees" className="text-blue-400 text-xs underline mt-1 inline-block">Onboard your first employee →</a>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {logs.map((log: any) => <TimelineItem key={log._id} log={log} />)}
            </div>
          )}

          {logs.length > 0 && (
            <a href="/provisioning" className="mt-3 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              View full audit log →
            </a>
          )}
        </div>

        {/* Right column: Integration health + System health */}
        <div className="space-y-5">
          {/* Integration Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Puzzle size={16} className="text-green-400" />
              <h2 className="text-base font-semibold text-white">Integration Health</h2>
            </div>
            {integrations.loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="shimmer h-3.5 w-24 rounded" />
                    <div className="shimmer h-5 w-14 rounded-full" />
                  </div>
                ))}
              </div>
            ) : integList.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">
                No integrations.{' '}
                <a href="/integrations" className="text-blue-400 underline">Add one</a>
              </p>
            ) : (
              <div className="space-y-1">
                {integList.slice(0, 6).map((integ: any) => (
                  <div key={integ._id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Circle
                        size={8}
                        className={`shrink-0 ${integ.status === 'active' ? 'text-emerald-400 fill-emerald-400' : integ.status === 'error' ? 'text-red-400 fill-red-400' : 'text-slate-600 fill-slate-600'}`}
                      />
                      <span className="text-sm text-slate-300 truncate">{integ.displayName}</span>
                    </div>
                    <span className={`${integBadge[integ.status] || 'badge-default'} shrink-0 ml-2`}>
                      {integ.isEnabled ? integ.status : 'off'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-amber-400" />
              <h2 className="text-base font-semibold text-white">Ticket Breakdown</h2>
            </div>
            {ticketStats.loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className="shimmer h-3 w-24 rounded" />
                    <div className="flex-1 shimmer h-1.5 rounded-full" />
                    <div className="shimmer h-3 w-6 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <SystemHealthRow label="Open" value={stats.open ?? 0} max={stats.total ?? 1} color="bg-amber-400" />
                <SystemHealthRow label="In Progress" value={stats.inProgress ?? 0} max={stats.total ?? 1} color="bg-blue-400" />
                <SystemHealthRow label="Resolved" value={stats.resolved ?? 0} max={stats.total ?? 1} color="bg-emerald-400" />
                <SystemHealthRow label="Critical" value={stats.critical ?? 0} max={stats.total ?? 1} color="bg-red-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer status bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-800 pt-4">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Zap size={11} className="text-blue-400" /> Real-time data
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={11} /> Auto-refresh in {countdown}s
          </span>
        </div>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
