'use client';

import { FormEvent, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useTickets } from '@/hooks/useTickets';
import type { CreateTicketPayload, TicketStatus } from '@/types/ticket';
import {
  Plus, Search, Bot, X, ChevronLeft, ChevronRight,
  RefreshCw, CheckCircle,
} from 'lucide-react';

const STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const CATEGORIES = ['software', 'hardware', 'access', 'provisioning', 'general', 'ai_detected'];

type PVariant = 'error' | 'warning' | 'info' | 'default';
const priorityVariant = (p: string): PVariant =>
  p === 'critical' ? 'error' : p === 'high' ? 'warning' : p === 'medium' ? 'info' : 'default';

type SVariant = 'success' | 'error' | 'warning' | 'info' | 'default';
const statusVariant = (s: string): SVariant =>
  s === 'resolved' || s === 'closed' ? 'success' : s === 'open' ? 'error' : 'warning';

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'medium',
  category: 'general',
  affectedSystem: '',
  reportedBy: '',
};

export default function TicketsPage() {
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const {
    tickets, total, stats, statsLoading, loading, error,
    refetch, createTicket, updateStatus,
  } = useTickets({
    page,
    limit: 15,
    status: filterStatus || undefined,
    priority: filterPriority || undefined,
  });

  const totalPages = Math.ceil(total / 15) || 1;

  const filtered = search
    ? tickets.filter((t) =>
        `${t.title} ${t.affectedSystem ?? ''}`.toLowerCase().includes(search.toLowerCase()),
      )
    : tickets;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = { ...form } as any;
      if (!payload.affectedSystem) delete payload.affectedSystem;
      if (!payload.reportedBy) delete payload.reportedBy;
      await createTicket(payload as CreateTicketPayload);
      setSubmitSuccess('Ticket created successfully!');
      setForm({ ...EMPTY_FORM });
      setTimeout(() => { setShowForm(false); setSubmitSuccess(''); }, 2000);
    } catch (err: any) {
      setSubmitError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await updateStatus(id, status as TicketStatus);
    } catch (err: any) {
      alert(`Update failed: ${err}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return <div>Test</div>;

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {[
              { label: 'Total', value: stats?.total, color: 'text-white' },
              { label: 'Open', value: stats?.open, color: 'text-red-400' },
              { label: 'In Progress', value: (stats as any)?.inProgress, color: 'text-amber-400' },
              { label: 'Resolved', value: stats?.resolved, color: 'text-emerald-400' },
              { label: 'Critical', value: stats?.critical, color: 'text-red-500' },
              { label: 'AI Generated', value: stats?.aiGenerated, color: 'text-purple-400' },
            ].map((s) => (
              <div key={s.label} className="card text-center py-3">
                <p className={`text-2xl font-bold ${s.color}`}>
                  {statsLoading ? '…' : (s.value ?? 0)}
                </p>
                <p className="text-slate-400 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Create Form */}
          {showForm && (
            <div className="card mb-6 border border-blue-800/50">
              <h2 className="text-lg font-semibold text-white mb-4">Create New Ticket</h2>
              {submitError && <div className="mb-4"><ErrorAlert message={submitError} /></div>}
              {submitSuccess && (
                <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 rounded-xl p-4 mb-4">
                  <CheckCircle size={18} className="text-emerald-400" />
                  <p className="text-emerald-300 text-sm">{submitSuccess}</p>
                </div>
              )}
              <form onSubmit={handleCreate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Title *</label>
                    <input required value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Brief description of the issue"
                      className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Description *</label>
                    <textarea required value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Detailed description of the issue…"
                      rows={3}
                      className="input-field resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Priority</label>
                    <select value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="input-field">
                      {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Category *</label>
                    <select required value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="input-field">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Affected System</label>
                    <input value={form.affectedSystem}
                      onChange={(e) => setForm({ ...form, affectedSystem: e.target.value })}
                      placeholder="e.g. prod-server-01"
                      className="input-field" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Reported By</label>
                    <input value={form.reportedBy}
                      onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
                      placeholder="Email or name"
                      className="input-field" />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <><Spinner size="sm" /> Creating…</> : 'Create Ticket'}
                </button>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500" />
            </div>
            <select value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Table */}
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
                      {['ID', 'Title', 'Priority', 'Status', 'Category', 'Affected', 'AI?', 'Created', 'Actions'].map((h) => (
                        <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-500">
                          No tickets found.{' '}
                          <button onClick={() => setShowForm(true)} className="text-blue-400 underline">Create one</button>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((ticket) => (
                        <tr key={ticket._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                          <td className="py-3 px-4 text-slate-500 text-xs font-mono">{ticket._id.slice(-6)}</td>
                          <td className="py-3 px-4 max-w-[280px]">
                            <p className="text-white truncate" title={ticket.title}>{ticket.title}</p>
                            {ticket.reportedBy && (
                              <p className="text-slate-500 text-xs mt-0.5">by {ticket.reportedBy}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge label={ticket.priority} variant={priorityVariant(ticket.priority)} />
                          </td>
                          <td className="py-3 px-4">
                            <Badge label={ticket.status} variant={statusVariant(ticket.status)} />
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{ticket.category}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{ticket.affectedSystem || '—'}</td>
                          <td className="py-3 px-4">
                            {ticket.isAutoGenerated ? (
                              <span className="flex items-center gap-1 text-xs text-purple-300">
                                <Bot size={12} />
                                {ticket.aiConfidenceScore != null
                                  ? `${Math.round(ticket.aiConfidenceScore * 100)}%`
                                  : 'Yes'}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                              <select
                                value={ticket.status}
                                disabled={updatingId === ticket._id}
                                onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                              >
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                  <p className="text-xs text-slate-400">Page {page} of {totalPages} — {total} tickets</p>
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
    </div>
  );
}
