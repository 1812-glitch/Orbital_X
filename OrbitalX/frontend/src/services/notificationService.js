import apiClient from '../lib/apiClient';

const notificationService = {
  getAll: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (notificationIds = []) => {
    const response = await apiClient.put('/notifications/read', { notificationIds });
    return response.data;
  },

  clearAll: async () => {
    const response = await apiClient.delete('/notifications');
    return response.data;
  }
};

export default notificationService;
