import apiClient from '../lib/apiClient';

export const authService = {
  updatePassword: async (currentPassword, newPassword) => {
    const response = await apiClient.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  }
};
