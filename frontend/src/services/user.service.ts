import axiosInstance from '@/lib/axios';
import type { User, CreateUserPayload, PaginatedUsers } from '@/types/user';

export const userService = {
  async create(payload: CreateUserPayload): Promise<{ message: string; user: Partial<User> }> {
    return axiosInstance.post('/onboarding/employee', payload);
  },

  async list(params?: {
    page?: number;
    limit?: number;
    role?: string;
    department?: string;
  }): Promise<PaginatedUsers> {
    return axiosInstance.get('/employees', { params });
  },

  async getById(id: string): Promise<User> {
    return axiosInstance.get(`/employees/${id}`);
  },

  async update(id: string, payload: Partial<CreateUserPayload>): Promise<User> {
    return axiosInstance.put(`/employees/${id}`, payload);
  },

  async offboard(id: string, reason?: string): Promise<{ message: string }> {
    return axiosInstance.post(`/offboarding/employee/${id}`, { reason });
  },

  async getProvisioningStatus(id: string) {
    return axiosInstance.get(`/onboarding/status/${id}`);
  },
};
