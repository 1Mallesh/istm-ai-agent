'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useUsers } from '@/hooks/useUsers';
import type { CreateUserPayload } from '@/types/user';
import {
  Plus, Search, Trash2, X, RefreshCw,
  ChevronLeft, ChevronRight, CheckCircle, UserCheck,
} from 'lucide-react';

const ROLES = [
  { value: 'developer', label: 'Developer', tools: 'GitHub, Jira, Slack, Zoom' },
  { value: 'engineer', label: 'Engineer', tools: 'GitHub, Jira, Slack, Zoom' },
  { value: 'hr', label: 'HR', tools: 'Zoho, Slack, Zoom' },
  { value: 'sales', label: 'Sales', tools: 'Salesforce, Slack, Zoom' },
  { value: 'finance', label: 'Finance', tools: 'SAP, Slack, Zoom' },
  { value: 'manager', label: 'Manager', tools: 'Jira, Slack, Zoom' },
  { value: 'it_admin', label: 'IT Admin', tools: 'All tools' },
  { value: 'marketing', label: 'Marketing', tools: 'Salesforce, Slack, Zoom' },
  { value: 'support', label: 'Support', tools: 'Jira, ServiceNow, Slack, Zoom' },
  { value: 'intern', label: 'Intern', tools: 'Slack, Zoom' },
  { value: 'executive', label: 'Executive', tools: 'Salesforce, Slack, Zoom, Jira' },
];

const DEPTS = ['Engineering', 'Human Resources', 'Sales', 'Finance', 'Marketing', 'IT', 'Operations', 'Support', 'Executive'];

const EMPTY: CreateUserPayload = {
  firstName: '', lastName: '', email: '', password: '',
  role: 'developer', department: 'Engineering',
  jobTitle: '', phoneNumber: '', location: '',
  employeeType: 'full_time', startDate: '',
};

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateUserPayload>({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { users, total, totalPages, loading, error, refetch, createUser, offboard } =
    useUsers({ page, limit: 10, role: roleFilter || undefined });

  const filtered = search
    ? users.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.companyEmail ?? ''}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : users;

  const selectedRole = ROLES.find((r) => r.value === form.role);

  const field = (key: keyof CreateUserPayload, label: string, opts?: { placeholder?: string; type?: string; required?: boolean }) => (
    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {label} {opts?.required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder}
        value={(form[key] as string) || ''}
        required={opts?.required}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="input-field"
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.startDate) delete payload.startDate;
      if (!payload.phoneNumber) delete payload.phoneNumber;
      if (!payload.location) delete payload.location;
      const res = await createUser(payload);
      const ce = (res as any)?.user?.companyEmail;
      setSubmitSuccess(
        `✓ Onboarded! Company email: ${ce ?? 'auto-generated'}. Provisioning Kafka event published.`,
      );
      setForm({ ...EMPTY });
      setTimeout(() => { setShowForm(false); setSubmitSuccess(''); }, 4000);
    } catch (err: any) {
      setSubmitError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOffboard = async (id: string, name: string) => {
    if (!confirm(`Offboard "${name}"? All accounts will be deprovisioned.`)) return;
    setDeletingId(id);
    try {
      await offboard(id, 'Offboarded via admin UI');
    } catch (err: any) {
      alert(`Failed: ${err}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-slate-400 text-sm mt-1">
            {loading ? 'Loading…' : `${total} employees — onboard to auto-provision accounts by role`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setSubmitError(''); setSubmitSuccess(''); }}
            className="btn-primary flex items-center gap-2"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'Onboard Employee'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 border border-blue-800/40">
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                <UserCheck size={18} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">New Employee Onboarding</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Company email is auto-generated. Accounts are provisioned via Kafka based on role.
                </p>
              </div>
            </div>

            {submitError && <div className="mb-4"><ErrorAlert message={submitError} /></div>}
            {submitSuccess && (
              <div className="flex items-start gap-2 bg-emerald-900/30 border border-emerald-800 rounded-xl p-4 mb-4">
                <CheckCircle size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-emerald-300 text-sm">{submitSuccess}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {field('firstName', 'First Name', { placeholder: 'John', required: true })}
                {field('lastName', 'Last Name', { placeholder: 'Doe', required: true })}
                {field('email', 'Personal Email', { placeholder: 'john@gmail.com', type: 'email', required: true })}

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role <span className="text-red-400">*</span></label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="input-field"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {selectedRole && (
                    <p className="text-xs text-slate-500 mt-1">
                      Will provision: <span className="text-blue-400">{selectedRole.tools}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Department <span className="text-red-400">*</span></label>
                  <select
                    required
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                    className="input-field"
                  >
                    {DEPTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>

                {field('jobTitle', 'Job Title', { placeholder: 'Senior Software Engineer', required: true })}
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Employment Type</label>
                  <select
                    value={form.employeeType}
                    onChange={(e) => setForm((f) => ({ ...f, employeeType: e.target.value as any }))}
                    className="input-field"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contractor">Contractor</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                {field('startDate', 'Start Date', { type: 'date' })}
                {field('phoneNumber', 'Phone', { placeholder: '+1 555 000 0000' })}
                {field('location', 'Location', { placeholder: 'New York, USA' })}
                {field('password', 'Temp Password', { placeholder: 'Leave blank for auto-generated', type: 'password' })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-800">
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <><Spinner size="sm" /> Onboarding…</> : <><UserCheck size={15} /> Onboard & Provision</>}
                </button>
                <p className="text-xs text-slate-500">
                  Saves to DB → publishes <code className="text-blue-400">employee.created</code> Kafka event → auto-provisions tools.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                  {['Name', 'Company Email', 'Role', 'Dept', 'Type', 'Status', 'Provisioned Tools', 'Start', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-slate-400 font-medium text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-14 text-slate-500">
                      No employees yet.{' '}
                      <button onClick={() => setShowForm(true)} className="text-blue-400 underline">Onboard the first one</button>
                    </td>
                  </tr>
                ) : filtered.map((emp) => (
                  <tr key={emp._id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{emp.firstName} {emp.lastName}</p>
                      <p className="text-slate-500 text-xs">{emp.email}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs">{emp.companyEmail || '—'}</td>
                    <td className="py-3 px-4"><Badge label={emp.role} variant="info" /></td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{emp.department}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{emp.employeeType?.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <Badge label={emp.status} variant={emp.status === 'active' ? 'success' : emp.status === 'pending' ? 'warning' : 'error'} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {emp.provisionedServices.length === 0
                          ? <span className="text-slate-500 text-xs italic">Pending provisioning</span>
                          : emp.provisionedServices.map((s) => (
                              <span key={s} className="text-xs bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/50">{s}</span>
                            ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {emp.startDate ? new Date(emp.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOffboard(emp._id, `${emp.firstName} ${emp.lastName}`)}
                        disabled={deletingId === emp._id}
                        className="text-slate-400 hover:text-red-400 transition-colors disabled:opacity-40"
                        title="Offboard employee"
                      >
                        {deletingId === emp._id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                      </button>
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
