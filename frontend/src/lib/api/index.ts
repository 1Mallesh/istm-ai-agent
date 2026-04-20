import axios, { AxiosError } from 'axios';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(
      (error.response?.data as any)?.message || error.message || 'Request failed',
    );
  },
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<any, any>('/auth/login', { email, password }),
  me: () => api.get<any, any>('/auth/me'),
};

// ── Employees ───────────────────────────────────────────────────────────────
export const employeesApi = {
  create: (data: any) => api.post<any, any>('/employees', data),
  list: (params?: Record<string, any>) =>
    api.get<any, any>('/employees', { params }),
  get: (id: string) => api.get<any, any>(`/employees/${id}`),
  update: (id: string, data: any) => api.put<any, any>(`/employees/${id}`, data),
  delete: (id: string) => api.delete<any, any>(`/employees/${id}`),
};

// ── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingApi = {
  onboard: (data: any) => api.post<any, any>('/onboarding/employee', data),
  status: (userId: string) =>
    api.get<any, any>(`/onboarding/status/${userId}`),
};

// ── Offboarding ──────────────────────────────────────────────────────────────
export const offboardingApi = {
  offboard: (userId: string, reason?: string) =>
    api.post<any, any>(`/offboarding/employee/${userId}`, { reason }),
  checklist: (userId: string) =>
    api.get<any, any>(`/offboarding/checklist/${userId}`),
};

// ── Provisioning ─────────────────────────────────────────────────────────────
export const provisioningApi = {
  getLogs: (params?: Record<string, any>) =>
    api.get<any, any>('/provisioning/logs', { params }),
  getUserLogs: (userId: string) =>
    api.get<any, any>(`/provisioning/logs/${userId}`),
  retry: (userId: string) =>
    api.post<any, any>(`/provisioning/retry/${userId}`),
};

// ── Integrations ─────────────────────────────────────────────────────────────
export const integrationsApi = {
  list: () => api.get<any, any>('/integrations'),
  configure: (
    provider: string,
    credentials: Record<string, string>,
    config?: Record<string, any>,
  ) =>
    api.post<any, any>(`/integrations/${provider}/configure`, {
      credentials,
      config,
    }),
  toggle: (provider: string, isEnabled: boolean) =>
    api.put<any, any>(`/integrations/${provider}/toggle`, { isEnabled }),
  test: (provider: string) =>
    api.get<any, any>(`/integrations/${provider}/test`),
};

// ── Tickets ───────────────────────────────────────────────────────────────────
export const ticketsApi = {
  create: (data: any) => api.post<any, any>('/tickets', data),
  list: (params?: Record<string, any>) =>
    api.get<any, any>('/tickets', { params }),
  get: (id: string) => api.get<any, any>(`/tickets/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put<any, any>(`/tickets/${id}/status`, { status }),
  stats: () => api.get<any, any>('/tickets/stats'),
  addComment: (id: string, author: string, content: string) =>
    api.post<any, any>(`/tickets/${id}/comments`, { author, content }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => api.get<any, any>('/admin/dashboard'),
  getRoleMappings: () => api.get<any, any>('/admin/role-mappings'),
  updateRoleMapping: (role: string, tools: string[], displayName?: string) =>
    api.put<any, any>(`/admin/role-mappings/${role}`, { tools, displayName }),
  bulkUpdate: (
    mappings: Array<{ role: string; tools: string[]; displayName?: string }>,
  ) => api.post<any, any>('/admin/role-mappings/bulk', { mappings }),
  getAvailableTools: () => api.get<any, any>('/admin/tools'),
};

export default api;
