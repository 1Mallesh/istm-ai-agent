'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorAlert } from '@/components/ui/ErrorAlert';
import { useIntegrations } from '@/hooks/useIntegrations';
import {
  CheckCircle, XCircle, AlertCircle, ChevronDown,
  Save, TestTube, RefreshCw, ToggleLeft, ToggleRight,
} from 'lucide-react';

const PROVIDER_META: Record<string, { fields: { key: string; label: string; type?: string }[]; category: string; description: string }> = {
  slack: {
    category: 'Communication', description: 'Team messaging and channel invitations',
    fields: [{ key: 'SLACK_BOT_TOKEN', label: 'Bot Token' }, { key: 'SLACK_WORKSPACE_ID', label: 'Workspace ID' }],
  },
  github: {
    category: 'Development', description: 'GitHub org membership and team assignments',
    fields: [{ key: 'GITHUB_TOKEN', label: 'Personal Access Token' }, { key: 'GITHUB_ORG', label: 'Organization Name' }],
  },
  google_workspace: {
    category: 'Productivity', description: 'Gmail, Drive & Calendar accounts',
    fields: [
      { key: 'GOOGLE_CLIENT_ID', label: 'Client ID' },
      { key: 'GOOGLE_CLIENT_SECRET', label: 'Client Secret' },
      { key: 'GOOGLE_REFRESH_TOKEN', label: 'Refresh Token' },
      { key: 'GOOGLE_DOMAIN', label: 'Domain (e.g. company.com)' },
    ],
  },
  microsoft_365: {
    category: 'Productivity', description: 'Outlook, Teams and OneDrive accounts',
    fields: [
      { key: 'MS365_TENANT_ID', label: 'Tenant ID' },
      { key: 'MS365_CLIENT_ID', label: 'Client ID' },
      { key: 'MS365_CLIENT_SECRET', label: 'Client Secret' },
    ],
  },
  jira: {
    category: 'Project Mgmt', description: 'Issue tracking and project access',
    fields: [
      { key: 'JIRA_HOST', label: 'Jira URL (https://company.atlassian.net)' },
      { key: 'JIRA_EMAIL', label: 'Admin Email' },
      { key: 'JIRA_API_TOKEN', label: 'API Token' },
    ],
  },
  zoom: {
    category: 'Communication', description: 'Video conferencing user creation',
    fields: [
      { key: 'ZOOM_ACCOUNT_ID', label: 'Account ID' },
      { key: 'ZOOM_CLIENT_ID', label: 'Client ID' },
      { key: 'ZOOM_CLIENT_SECRET', label: 'Client Secret' },
    ],
  },
  zoho: {
    category: 'HR', description: 'HR employee records and HRMS',
    fields: [
      { key: 'ZOHO_CLIENT_ID', label: 'Client ID' },
      { key: 'ZOHO_CLIENT_SECRET', label: 'Client Secret' },
      { key: 'ZOHO_REFRESH_TOKEN', label: 'Refresh Token' },
    ],
  },
  servicenow: {
    category: 'ITSM', description: 'ServiceNow user creation and incident management',
    fields: [
      { key: 'SERVICENOW_INSTANCE', label: 'Instance URL' },
      { key: 'SERVICENOW_USERNAME', label: 'Admin Username' },
      { key: 'SERVICENOW_PASSWORD', label: 'Password', type: 'password' },
    ],
  },
  sap: {
    category: 'ERP', description: 'SAP HCM user provisioning',
    fields: [
      { key: 'SAP_HOST', label: 'SAP Host URL' },
      { key: 'SAP_CLIENT', label: 'Client Number' },
      { key: 'SAP_USERNAME', label: 'Username' },
      { key: 'SAP_PASSWORD', label: 'Password', type: 'password' },
    ],
  },
  salesforce: {
    category: 'CRM', description: 'Salesforce user provisioning and deactivation',
    fields: [
      { key: 'SALESFORCE_CLIENT_ID', label: 'Connected App Client ID' },
      { key: 'SALESFORCE_CLIENT_SECRET', label: 'Client Secret' },
      { key: 'SALESFORCE_USERNAME', label: 'Admin Username' },
      { key: 'SALESFORCE_PASSWORD', label: 'Password', type: 'password' },
      { key: 'SALESFORCE_SECURITY_TOKEN', label: 'Security Token' },
    ],
  },
};

const ALL_PROVIDERS = Object.keys(PROVIDER_META);

export default function IntegrationsPage() {
  const { integrations, loading, error, refetch, configure, toggle, testConnection } = useIntegrations();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});
  const [saveMsg, setSaveMsg] = useState<Record<string, string>>({});

  const byProvider: Record<string, any> = {};
  integrations.forEach((i) => { byProvider[i.provider] = i; });

  const handleSave = async (provider: string) => {
    const creds = credentials[provider] || {};
    if (Object.keys(creds).length === 0) {
      setSaveMsg({ ...saveMsg, [provider]: 'Enter at least one credential first.' });
      return;
    }
    setSaving(provider);
    setSaveMsg({});
    try {
      await configure(provider, creds);
      setSaveMsg({ ...saveMsg, [provider]: 'Saved successfully!' });
    } catch (err: any) {
      setSaveMsg({ ...saveMsg, [provider]: `Error: ${err}` });
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (provider: string) => {
    setTesting(provider);
    setTestResult((r) => ({ ...r, [provider]: null }));
    try {
      const res = await testConnection(provider) as any;
      setTestResult((r) => ({ ...r, [provider]: res.connected }));
    } catch {
      setTestResult((r) => ({ ...r, [provider]: false }));
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (provider: string, current: boolean) => {
    setToggling(provider);
    try {
      await toggle(provider, !current);
    } catch (err: any) {
      alert(`Toggle failed: ${err}`);
    } finally {
      setToggling(null);
    }
  };

  const statusIcon = (status: string) =>
    status === 'active' ? CheckCircle : status === 'error' ? XCircle : AlertCircle;
  const statusColor = (status: string) =>
    status === 'active' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-slate-400';

  const activeCount = integrations.filter((i) => i.isEnabled && i.status === 'active').length;
  const errorCount = integrations.filter((i) => i.status === 'error').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400 text-sm mt-1">Configure third-party service connections</p>
        </div>
        <button onClick={refetch} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={refetch} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active', value: loading ? '…' : activeCount, color: 'text-emerald-400' },
          { label: 'Errors', value: loading ? '…' : errorCount, color: 'text-red-400' },
          { label: 'Total', value: loading ? '…' : String(ALL_PROVIDERS.length), color: 'text-blue-400' },
        ].map((s) => (
          <div key={s.label} className="card text-center py-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {ALL_PROVIDERS.map((provider) => {
            const meta = PROVIDER_META[provider];
            const live = byProvider[provider];
            const status = live?.status ?? 'inactive';
            const isEnabled = live?.isEnabled ?? false;
            const SIcon = statusIcon(status);
            const isExpanded = expanded === provider;

            return (
              <div key={provider} className="card p-0 overflow-hidden">
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : provider)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400">
                        {provider[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-white capitalize">{provider.replace(/_/g, ' ')}</h3>
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{meta.category}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{meta.description}</p>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <SIcon size={18} className={statusColor(status)} />
                    {live && (
                      <button
                        onClick={() => handleToggle(provider, isEnabled)}
                        disabled={toggling === provider}
                        title={isEnabled ? 'Disable' : 'Enable'}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {toggling === provider ? (
                          <Spinner size="sm" />
                        ) : isEnabled ? (
                          <ToggleRight size={22} className="text-emerald-400" />
                        ) : (
                          <ToggleLeft size={22} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800 p-5">
                    {live?.lastErrorMessage && (
                      <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg">
                        <p className="text-red-300 text-xs">{live.lastErrorMessage}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {meta.fields.map((f) => (
                        <div key={f.key}>
                          <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                          <input
                            type={f.type === 'password' ? 'password' : 'text'}
                            placeholder={`Enter ${f.key}`}
                            value={credentials[provider]?.[f.key] || ''}
                            onChange={(e) =>
                              setCredentials({
                                ...credentials,
                                [provider]: {
                                  ...(credentials[provider] || {}),
                                  [f.key]: e.target.value,
                                },
                              })
                            }
                            className="input-field"
                          />
                        </div>
                      ))}
                    </div>

                    {saveMsg[provider] && (
                      <p className={`text-xs mb-3 ${saveMsg[provider].startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {saveMsg[provider]}
                      </p>
                    )}

                    {testResult[provider] !== undefined && testResult[provider] !== null && (
                      <p className={`text-xs mb-3 ${testResult[provider] ? 'text-emerald-400' : 'text-red-400'}`}>
                        Connection {testResult[provider] ? '✓ successful' : '✗ failed'}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleSave(provider)}
                        disabled={saving === provider}
                        className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {saving === provider ? <Spinner size="sm" /> : <Save size={14} />}
                        Save Credentials
                      </button>
                      <button
                        onClick={() => handleTest(provider)}
                        disabled={testing === provider}
                        className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-50"
                      >
                        {testing === provider ? <Spinner size="sm" /> : <TestTube size={14} />}
                        Test Connection
                      </button>
                    </div>

                    {live && (
                      <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                        <div>Syncs: <span className="text-white">{live.syncCount}</span></div>
                        <div>Errors: <span className={live.errorCount > 0 ? 'text-red-400' : 'text-white'}>{live.errorCount}</span></div>
                        <div>
                          Last sync:{' '}
                          <span className="text-white">
                            {live.lastSyncAt ? new Date(live.lastSyncAt).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
