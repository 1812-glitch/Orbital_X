import apiClient from '../lib/apiClient';

const satelliteService = {
  getAll: async () => {
    const response = await apiClient.get('/satellites');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/satellites/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/satellites', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/satellites/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/satellites/${id}`);
    return response.data;
  }
};

export default satelliteService;
