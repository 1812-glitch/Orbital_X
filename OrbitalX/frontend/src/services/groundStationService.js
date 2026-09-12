import api from '../lib/apiClient';

export const groundStationService = {
  getAllGroundStations: async () => {
    try {
      const response = await api.get('/ground-stations');
      return response.data;
    } catch (error) {
      console.error('Error fetching ground stations:', error);
      throw error;
    }
  }
};
