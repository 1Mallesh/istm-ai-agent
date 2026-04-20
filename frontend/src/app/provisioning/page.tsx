'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useAsync } from '@/lib/hooks/useAsync';
import { provisioningApi } from '@/lib/api';
import {
  CheckCircle, XCircle, Clock, RefreshCw, RotateCcw,
  ChevronLeft, ChevronRight, Search, Filter,
} from 'lucide-react';

const ACTION_VARIANTS: Record<string, any> = {
  provision: 'info',
  deprovision: 'warning',
  update: 'default',
  retry: 'default',
};

export default function ProvisioningPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [retrying, setRetrying] = useState<string | null>(null);

  const { data, loading, error, refetch } = useAsync(
    () =>
      provisioningApi.getLogs({
        page,
        limit: 20,
        ...(filterStatus ? { status: filterStatus } : {}),
      }),
    [page, filterStatus],
  );

  const logs: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20) || 1;

  const filtered = search
    ? logs.filter((l) =>
        `${l.userEmail} ${l.provider} ${l.role}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : logs;

  // Aggregate stats from the current page
  const succeeded = logs.filter((l) => l.status === 'success').length;
  const failed = logs.filter((l) => l.status === 'failed').length;
  const inProgress = logs.filter((l) => l.status === 'in_progress' || l.status === 'pending').length;

  const handleRetry = async (userId: string) => {
    setRetrying(userId);
    try {
      await provisioningApi.retry(userId);
      setTimeout(refetch, 1500);
    } catch (err: any) {
      alert(`Retry failed: ${err}`);
    } finally {
      setRetrying(null);
    }
  };

  const StatusCell = ({ status }: { status: string }) => {
    if (status === 'success')
      return <div className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle size={13} /> Success</div>;
    if (status === 'failed')
      return <div className="flex items-center gap-1.5 text-red-400 text-xs"><XCircle size={13} /> Failed</div>;
    return <div className="flex items-center gap-1.5 text-amber-400 text-xs"><Clock size={13} /> {status}</div>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Provisioning Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Audit trail for all account provisioning operations</p>
        </div>
        <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total (page)', value: logs.length, color: 'text-white' },
          { label: 'Succeeded', value: succeeded, color: 'text-emerald-400' },
          { label: 'Failed', value: failed, color: 'text-red-400' },
          { label: 'Pending/Progress', value: inProgress, color: 'text-amber-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center py-5">
            <p className={`text-2xl font-bold ${s.color}`}>{loading ? '…' : s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-stretch gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email, provider, role…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="in_progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {error ? (
        <ErrorAlert message={error} onRetry={refetch} />
      ) : loading ? (
        <div className="card flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Employee', 'Role', 'Provider', 'Action', 'Status', 'External ID', 'Error', 'Retries', 'Time', ''].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500">
                      No provisioning logs yet. Onboard an employee to get started.
                    </td>
                  </tr>
                ) : (
                  filtered.map((log: any) => (
                    <tr key={log._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="py-3 px-4 text-slate-300 text-xs">{log.userEmail}</td>
                      <td className="py-3 px-4"><Badge label={log.role} variant="info" /></td>
                      <td className="py-3 px-4 text-slate-300 text-xs">{log.provider}</td>
                      <td className="py-3 px-4"><Badge label={log.action} variant={ACTION_VARIANTS[log.action] || 'default'} /></td>
                      <td className="py-3 px-4"><StatusCell status={log.status} /></td>
                      <td className="py-3 px-4 text-slate-300 text-xs">{log.externalId || '—'}</td>
                      <td className="py-3 px-4 text-slate-300 text-xs">{log.errorMessage || '—'}</td>
                      <td className="py-3 px-4 text-slate-300 text-xs">{log.retryCount ?? 0}</td>
                      <td className="py-3 px-4 text-slate-300 text-xs whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {log.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(log.userId)}
                            disabled={retrying === log.userId}
                            className="text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} — {total} logs</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40">
                  <ChevronLeft size={15} className="text-white" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40">
                  <ChevronRight size={15} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
