'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { adminService } from '@/services/admin.service';
import { Save, RefreshCw, CheckCircle, Plus, Trash2 } from 'lucide-react';

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

  return <div>Test</div>;
}
