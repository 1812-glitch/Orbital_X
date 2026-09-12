import apiClient from '../lib/apiClient';

const analyticsService = {
  getFleetAnalytics: async (params) => {
    const response = await apiClient.get('/analytics/fleet', { params });
    return response.data;
  },

  getReports: async () => {
    const response = await apiClient.get('/analytics/reports');
    return response.data;
  }
};

export default analyticsService;
