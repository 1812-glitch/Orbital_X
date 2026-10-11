import apiClient from '../lib/apiClient';

const aiService = {
  /**
   * Request AI Diagnosis for an alert or raw telemetry anomaly
   * @param {Object} payload { alertId, satelliteId, subsystem, metric, value, threshold, message, type }
   */
  diagnose: async (payload) => {
    const response = await apiClient.post('/ai/diagnose', payload);
    return response.data;
  }
};

export default aiService;
