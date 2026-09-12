import apiClient from '../lib/apiClient';

const alertService = {
  getAll: async (params) => {
    const response = await apiClient.get('/alerts', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/alerts/stats');
    return response.data;
  },

  updateStatus: async (id, action) => {
    const response = await apiClient.put(`/alerts/${id}/status`, { action });
    return response.data;
  }
};

export default alertService;
