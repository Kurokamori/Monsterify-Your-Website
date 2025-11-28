import api from './api';

/**
 * Service for interacting with area-related API endpoints
 */
class AreaService {
  /**
   * Get all available landmasses
   */
  async getLandmasses() {
    try {
      const response = await api.get('/areas/landmasses');
      return response.data;
    } catch (error) {
      console.error('Error fetching landmasses:', error);
      throw error;
    }
  }

  /**
   * Get regions for a specific landmass
   */
  async getRegions(landmassId) {
    try {
      const response = await api.get(`/areas/landmasses/${landmassId}/regions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      throw error;
    }
  }

  /**
   * Get areas for a specific region
   */
  async getAreas(regionId) {
    try {
      const response = await api.get(`/areas/regions/${regionId}/areas`);
      return response.data;
    } catch (error) {
      console.error('Error fetching areas:', error);
      throw error;
    }
  }

  /**
   * Get configuration for a specific area
   */
  async getAreaConfiguration(areaId) {
    try {
      const response = await api.get(`/areas/${areaId}/configuration`);
      return response.data;
    } catch (error) {
      console.error('Error fetching area configuration:', error);
      throw error;
    }
  }

  /**
   * Get complete area hierarchy (landmasses -> regions -> areas)
   */
  async getAreaHierarchy() {
    try {
      const response = await api.get('/areas/hierarchy');
      return response.data;
    } catch (error) {
      console.error('Error fetching area hierarchy:', error);
      throw error;
    }
  }
}

export default new AreaService();
