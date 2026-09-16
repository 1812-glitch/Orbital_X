import apiClient from '../lib/apiClient';

const notificationService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/notifications', data);
    return response.data;
  },

  markAsRead: async (notificationIds = [], id = null) => {
    const response = await apiClient.put('/notifications/read', { notificationIds, id });
    return response.data;
  },

  clearAll: async (id = null) => {
    const response = await apiClient.delete('/notifications', { params: id ? { id } : {} });
    return response.data;
  }
};

export default notificationService;

