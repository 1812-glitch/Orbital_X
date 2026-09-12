import api from '../lib/apiClient';

export const adminService = {
  getUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const response = await api.put(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  toggleUserStatus: async (userId, isActive) => {
    try {
      const response = await api.put(`/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  getAuditLogs: async (params) => {
    try {
      const response = await api.get('/audit', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  getSimulationStatus: async () => {
    const res = await api.get('/admin/simulation/status');
    return res.data;
  },

  startSimulation: async () => {
    const res = await api.post('/admin/simulation/start');
    return res.data;
  },

  stopSimulation: async () => {
    const res = await api.post('/admin/simulation/stop');
    return res.data;
  },

  setSimulationSpeed: async (speedMultiplier) => {
    const res = await api.post('/admin/simulation/speed', { speedMultiplier });
    return res.data;
  }
};
