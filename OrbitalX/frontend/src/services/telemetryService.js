import apiClient from '../lib/apiClient';

const telemetryService = {
  // Get latest telemetry for all active satellites
  getLatestTelemetry: async () => {
    const response = await apiClient.get('/telemetry/latest');
    return response.data;
  },

  // Get fleet stats
  getFleetStats: async () => {
    try {
      const response = await apiClient.get('/telemetry/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching fleet stats:', error);
      throw error;
    }
  },

  getHistoricalTelemetry: async () => {
    try {
      const response = await apiClient.get('/telemetry/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching historical telemetry:', error);
      throw error;
    }
  }
};

export default telemetryService;
