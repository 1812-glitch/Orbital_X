import api from '../lib/apiClient';

export const communicationService = {
  getMissionCommunications: async (missionId) => {
    try {
      const response = await api.get(`/communications/mission/${missionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching communications:', error);
      throw error;
    }
  },

  postCommunication: async (satelliteId, message, type = 'COMMAND') => {
    try {
      const response = await api.post('/communications', {
        satelliteId,
        message,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Error posting communication:', error);
      throw error;
    }
  }
};
