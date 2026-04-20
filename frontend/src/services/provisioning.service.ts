import axiosInstance from '@/lib/axios';

export const provisioningService = {
  async getLogs(params?: {
    page?: number;
    limit?: number;
    userId?: string;
    status?: string;
  }) {
    return axiosInstance.get('/provisioning/logs', { params });
  },

  async getUserLogs(userId: string) {
    return axiosInstance.get(`/provisioning/logs/${userId}`);
  },

  async retry(userId: string): Promise<{ message: string }> {
    return axiosInstance.post(`/provisioning/retry/${userId}`);
  },
};
