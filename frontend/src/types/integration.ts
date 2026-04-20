export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'configuring';

export interface Integration {
  _id: string;
  provider: string;
  displayName: string;
  status: IntegrationStatus;
  isEnabled: boolean;
  config: Record<string, any>;
  lastSyncAt?: string;
  lastErrorMessage?: string;
  syncCount: number;
  errorCount: number;
  supportedOperations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConfigureIntegrationPayload {
  credentials: Record<string, string>;
  config?: Record<string, any>;
}
