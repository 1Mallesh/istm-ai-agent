'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageLoader } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { userService } from '@/services/user.service';
import { ticketService } from '@/services/ticket.service';
import { integrationService } from '@/services/integration.service';
import { provisioningService } from '@/services/provisioning.service';
import {
  Users, Ticket, CheckCircle, AlertTriangle,
  Puzzle, Bot, Activity, RefreshCw,
} from 'lucide-react';

function useAsyncData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    mounted.current = true;
    refetch();
    return () => { mounted.current = false; };
  }, [refetch]);

  return { data, loading, error, refetch };
}

function useDashboardData() {
  const employees = useAsyncData(() => userService.list({ limit: 5, page: 1 }));
  const ticketStats = useAsyncData(() => ticketService.getStats());
  const integrations = useAsyncData(() => integrationService.list());
  const provLogs = useAsyncData(() => provisioningService.getLogs({ limit: 8, page: 1 }));

  const refetch = () => {
    employees.refetch();
    ticketStats.refetch();
    integrations.refetch();
    provLogs.refetch();
  };

  return { employees, ticketStats, integrations, provLogs, refetch };
}

const statusVariantClass: Record<string, string> = {
  success: 'badge-success',
  failed: 'badge-error',
  in_progress: 'badge-warning',
  pending: 'badge-info',
};

const integStatusClass: Record<string, string> = {
  active: 'badge-success',
  error: 'badge-error',
  inactive: 'badge-info',
  configuring: 'badge-warning',
};

export default function DashboardPage() {
  const { employees, ticketStats, integrations, provLogs, refetch } =
    useDashboardData();

  const loading =
    employees.loading &&
    ticketStats.loading &&
    integrations.loading &&
    provLogs.loading;

  const activeIntegrations = useMemo(
    () => (integrations.data ?? []).filter((i: any) => i.isEnabled && i.status === 'active').length,
    [integrations.data],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageLoader />
      </div>
    );
  }

  const stats: any = ticketStats.data ?? {};
  const totalEmployees = (employees.data as any)?.total ?? 0;
  const logs: any[] = (provLogs.data as any)?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time ITSM operations overview</p>
        </div>
        <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Error banners */}
      {ticketStats.error && (
        <ErrorAlert message={`Ticket stats: ${ticketStats.error}`} onRetry={ticketStats.refetch} />
      )}

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard title="Total Employees" value={employees.loading ? '...' : totalEmployees} subtitle="Across all departments" icon={Users} color="blue" />
        <StatsCard title="Active Integrations" value={integrations.loading ? '...' : activeIntegrations} subtitle={`of ${(integrations.data as any)?.length ?? 0} configured`} icon={Puzzle} color="green" />
        <StatsCard title="Open Tickets" value={ticketStats.loading ? '...' : (stats.open ?? 0)} subtitle={`${stats.critical ?? 0} critical`} icon={Ticket} color="amber" />
        <StatsCard title="AI Detected Issues" value={ticketStats.loading ? '...' : (stats.aiGenerated ?? 0)} subtitle="Auto-ticketed" icon={Bot} color="purple" />
      </div>

      {/* Stat cards row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Total Tickets" value={ticketStats.loading ? '...' : (stats.total ?? 0)} subtitle="All time" icon={Ticket} color="blue" />
        <StatsCard title="Resolved Tickets" value={ticketStats.loading ? '...' : (stats.resolved ?? 0)} subtitle="Closed successfully" icon={CheckCircle} color="green" />
        <StatsCard title="Critical Alerts" value={ticketStats.loading ? '...' : (stats.critical ?? 0)} subtitle="Require immediate action" icon={AlertTriangle} color="red" />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provisioning Activity */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Provisioning</h2>
            <Activity size={18} className="text-slate-400" />
          </div>
          {provLogs.loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
            </div>
          ) : provLogs.error ? (
            <ErrorAlert message={provLogs.error} onRetry={provLogs.refetch} />
          ) : logs.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No provisioning activity yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div key={log._id} className="flex items-start gap-3 pb-3 border-b border-slate-700 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${log.status === 'success' ? 'bg-emerald-400' : log.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">
                      <span className="font-medium">{log.action}</span>{' '}{log.provider} —{' '}
                      <span className="text-slate-400">{log.userEmail}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={statusVariantClass[log.status] || 'badge-info'}>{log.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integration Health */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Integration Health</h2>
          {integrations.loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
            </div>
          ) : integrations.error ? (
            <ErrorAlert message={integrations.error} onRetry={integrations.refetch} />
          ) : ((integrations.data as any[]) ?? []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">
              No integrations configured yet.{' '}
              <a href="/integrations" className="text-blue-400 underline">Add one</a>
            </p>
          ) : (
            <div className="space-y-2">
              {((integrations.data as any[]) ?? []).map((integ: any) => (
                <div key={integ._id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                  <span className="text-sm text-slate-300">{integ.displayName}</span>
                  <div className="flex items-center gap-3">
                    {integ.lastSyncAt && (
                      <span className="text-xs text-slate-500">{new Date(integ.lastSyncAt).toLocaleTimeString()}</span>
                    )}
                    <span className={integStatusClass[integ.status] || 'badge-info'}>
                      {integ.isEnabled ? integ.status : 'disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
