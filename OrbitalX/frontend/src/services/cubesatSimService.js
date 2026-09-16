import apiClient from '../lib/apiClient';

export const cubesatSimService = {
  getState: async (id = null) => {
    const response = await apiClient.get('/telemetry/cubesat/state', {
      params: id ? { id } : {}
    });
    return response.data;
  },

  sendCommand: async (satelliteId, command, params = {}) => {
    const response = await apiClient.post('/telemetry/cubesat/command', {
      satelliteId,
      command,
      params
    });
    return response.data;
  }
};

export default cubesatSimService;
