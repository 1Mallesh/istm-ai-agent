import axiosInstance from '@/lib/axios';
import type { Integration, ConfigureIntegrationPayload } from '@/types/integration';

export const integrationService = {
  async list(): Promise<Integration[]> {
    return axiosInstance.get('/integrations');
  },

  async configure(
    provider: string,
    payload: ConfigureIntegrationPayload,
  ): Promise<Integration> {
    return axiosInstance.post(`/integrations/${provider}/configure`, payload);
  },

  async toggle(provider: string, isEnabled: boolean): Promise<Integration> {
    return axiosInstance.put(`/integrations/${provider}/toggle`, { isEnabled });
  },

  async testConnection(provider: string): Promise<{ provider: string; connected: boolean }> {
    return axiosInstance.get(`/integrations/${provider}/test`);
  },
};
