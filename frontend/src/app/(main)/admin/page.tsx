'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { adminService } from '@/services/admin.service';
import { Save, RefreshCw, CheckCircle, Plus, Trash2, ShieldCheck } from 'lucide-react';

const ALL_TOOLS = [
  { id: 'slack', name: 'Slack', color: 'bg-purple-900/60 text-purple-300 border-purple-700' },
  { id: 'github', name: 'GitHub', color: 'bg-slate-700/60 text-slate-200 border-slate-600' },
  { id: 'jira', name: 'Jira', color: 'bg-blue-900/60 text-blue-300 border-blue-700' },
  { id: 'zoom', name: 'Zoom', color: 'bg-sky-900/60 text-sky-300 border-sky-700' },
  { id: 'google_workspace', name: 'Google Workspace', color: 'bg-green-900/60 text-green-300 border-green-700' },
  { id: 'microsoft_365', name: 'Microsoft 365', color: 'bg-indigo-900/60 text-indigo-300 border-indigo-700' },
  { id: 'zoho', name: 'Zoho', color: 'bg-orange-900/60 text-orange-300 border-orange-700' },
  { id: 'salesforce', name: 'Salesforce', color: 'bg-cyan-900/60 text-cyan-300 border-cyan-700' },
  { id: 'servicenow', name: 'ServiceNow', color: 'bg-emerald-900/60 text-emerald-300 border-emerald-700' },
  { id: 'sap', name: 'SAP', color: 'bg-yellow-900/60 text-yellow-300 border-yellow-700' },
];

export default function AdminPage() {
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getRoleMappings();
      if (mountedRef.current) setRawData(res);
    } catch (err: any) {
      if (mountedRef.current) setError(String(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => { mountedRef.current = false; };
  }, [refetch]);

  const [mappings, setMappings] = useState<any[]>([]);
  const [newRole, setNewRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!rawData) return;
    const data = rawData;
    // Merge DB configured roles with defaults
    const configured: any[] = data.configured ?? [];
    const defaults: Record<string, string[]> = data.defaults ?? {};

    const merged: any[] = [...configured];

    Object.entries(defaults).forEach(([role, tools]) => {
      const exists = merged.find((m: any) => m.name === role);
      if (!exists) {
        merged.push({ name: role, displayName: role, requiredTools: tools, fromDefault: true });
      }
    });

    setMappings(merged);
  }, [rawData]);

  const toggleTool = (idx: number, toolId: string) => {
    const updated = [...mappings];
    const current = updated[idx].requiredTools ?? [];
    updated[idx] = {
      ...updated[idx],
      requiredTools: current.includes(toolId)
        ? current.filter((t: string) => t !== toolId)
        : [...current, toolId],
    };
    setMappings(updated);
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveError('');
    try {
      await adminService.bulkUpdateMappings(
        mappings.map((m) => ({
          role: m.name,
          tools: m.requiredTools ?? [],
          displayName: m.displayName,
        })),
      );
      setSaveMsg('All role mappings saved successfully!');
      refetch();
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const addRole = () => {
    if (!newRole.trim()) return;
    const normalized = newRole.toLowerCase().replace(/\s+/g, '_');
    if (mappings.find((m) => m.name === normalized)) {
      alert('Role already exists');
      return;
    }
    setMappings([
      ...mappings,
      { name: normalized, displayName: newRole, requiredTools: [], isNew: true },
    ]);
    setNewRole('');
  };

  const removeRole = (idx: number) => {
    setMappings(mappings.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Config</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure which tools are provisioned per role when an employee is onboarded
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={saveAll}
            disabled={saving || loading}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {saving ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Saving…</>
            ) : (
              <><Save size={15} /> Save All</>
            )}
          </button>
        </div>
      </div>

      {/* Save feedback */}
      {saveMsg && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-800 rounded-lg p-3 mb-5">
          <CheckCircle size={15} className="text-emerald-400 shrink-0" />
          <p className="text-emerald-300 text-sm">{saveMsg}</p>
        </div>
      )}
      {saveError && <div className="mb-5"><ErrorAlert message={saveError} /></div>}
      {error && <div className="mb-5"><ErrorAlert message={error} onRetry={refetch} /></div>}

      {/* Add new role */}
      <div className="card mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <ShieldCheck size={18} className="text-blue-400 shrink-0" />
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRole()}
            placeholder="New role name (e.g. Designer)"
            className="input-field flex-1"
          />
        </div>
        <button
          onClick={addRole}
          disabled={!newRole.trim()}
          className="btn-primary flex items-center gap-2 text-sm disabled:opacity-40 shrink-0"
        >
          <Plus size={15} /> Add Role
        </button>
      </div>

      {/* Role cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : mappings.length === 0 ? (
        <div className="card text-center py-16 text-slate-500">
          No role mappings found. Add a role above to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {mappings.map((mapping, idx) => (
            <div key={mapping.name} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white capitalize">
                    {mapping.displayName || mapping.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {mapping.requiredTools?.length ?? 0} tool{mapping.requiredTools?.length !== 1 ? 's' : ''} provisioned
                    {mapping.fromDefault && <span className="ml-2 text-amber-400">· default</span>}
                    {mapping.isNew && <span className="ml-2 text-blue-400">· new (unsaved)</span>}
                  </p>
                </div>
                <button
                  onClick={() => removeRole(idx)}
                  className="text-slate-600 hover:text-red-400 transition-colors p-1"
                  title="Remove role"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {ALL_TOOLS.map((tool) => {
                  const active = (mapping.requiredTools ?? []).includes(tool.id);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(idx, tool.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        active
                          ? tool.color
                          : 'bg-slate-800/40 text-slate-500 border-slate-700 hover:border-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}{tool.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 mt-8 text-center">
        Changes take effect when you click "Save All". New employees are provisioned based on these mappings via Kafka events.
      </p>
    </div>
  );
}
