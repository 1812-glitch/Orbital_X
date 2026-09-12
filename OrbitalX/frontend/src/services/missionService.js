import apiClient from '../lib/apiClient';

const missionService = {
  getAll: async () => {
    const response = await apiClient.get('/missions');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/missions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/missions', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/missions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/missions/${id}`);
    return response.data;
  }
};

export default missionService;
