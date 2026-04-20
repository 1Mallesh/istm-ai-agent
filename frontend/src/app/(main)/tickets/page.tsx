


'use client';

import { useState } from 'react';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tickets</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading…' : `${total} total tickets`}
            {!statsLoading && stats && (
              <span className="ml-2 text-slate-500">
                — {stats.open ?? 0} open, {stats.resolved ?? 0} resolved
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setSubmitError(''); setSubmitSuccess(''); }}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Ticket'}
          </button>
        </div>
      </div>

      {/* Create Ticket Form */}
      {showForm && (
        <div className="card mb-6 border border-blue-800/40">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create Support Ticket</h2>
              <p className="text-xs text-slate-400 mt-0.5">Tickets are routed and assigned automatically by AI.</p>
            </div>
          </div>

          {submitError && <div className="mb-4"><ErrorAlert message={submitError} /></div>}
          {submitSuccess && (
            <div className="flex items-start gap-2 bg-emerald-900/30 border border-emerald-800 rounded-xl p-4 mb-4">
              <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-300 text-sm">{submitSuccess}</p>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Title <span className="text-red-400">*</span></label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="input-field w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Description <span className="text-red-400">*</span></label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detailed description of the issue…"
                  className="input-field w-full resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="input-field w-full"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="input-field w-full"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Affected System</label>
                <input
                  value={form.affectedSystem}
                  onChange={(e) => setForm((f) => ({ ...f, affectedSystem: e.target.value }))}
                  placeholder="e.g. GitHub, Slack, VPN…"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Reported By (email)</label>
                <input
                  type="email"
                  value={form.reportedBy}
                  onChange={(e) => setForm((f) => ({ ...f, reportedBy: e.target.value }))}
                  placeholder="user@company.com"
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Submitting…</> : <><Plus size={15} /> Create Ticket</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
      </div>

      {/* Tickets Table */}
      {error ? (
        <ErrorAlert message={error} onRetry={refetch} />
      ) : loading ? (
        <div className="card flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {['ID', 'Title', 'Category', 'Priority', 'Status', 'Affected System', 'Reported By', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-slate-500">
                      No tickets found.{' '}
                      <button onClick={() => setShowForm(true)} className="text-blue-400 underline">Create the first one</button>
                    </td>
                  </tr>
                ) : filtered.map((ticket) => (
                  <tr key={ticket._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono">
                      {ticket._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="text-white font-medium truncate">{ticket.title}</p>
                      {ticket.description && (
                        <p className="text-slate-500 text-xs truncate mt-0.5">{ticket.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={ticket.category} variant="info" />
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={ticket.priority} variant={priorityVariant(ticket.priority)} />
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={ticket.status.replace('_', ' ')} variant={statusVariant(ticket.status)} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{ticket.affectedSystem ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{ticket.reportedBy ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {updatingId === ticket._id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500 inline-block" />
                      ) : (
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} — {total} total</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40">
                  <ChevronLeft size={14} className="text-white" />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40">
                  <ChevronRight size={14} className="text-white" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
