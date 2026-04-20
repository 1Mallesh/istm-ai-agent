import axiosInstance from '@/lib/axios';

export const adminService = {
  async getDashboard() {
    return axiosInstance.get('/admin/dashboard');
  },

  async getRoleMappings() {
    return axiosInstance.get('/admin/role-mappings');
  },

  async updateRoleMapping(role: string, tools: string[], displayName?: string) {
    return axiosInstance.put(`/admin/role-mappings/${role}`, { tools, displayName });
  },

  async bulkUpdateMappings(
    mappings: Array<{ role: string; tools: string[]; displayName?: string }>,
  ) {
    return axiosInstance.post('/admin/role-mappings/bulk', { mappings });
  },

  async getAvailableTools() {
    return axiosInstance.get('/admin/tools');
  },
};
