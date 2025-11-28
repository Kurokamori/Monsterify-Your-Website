import api from './api';

/**
 * Get all guide categories with their structure
 * @returns {Promise<Object>} Categories data
 */
export const getCategories = async () => {
  try {
    const response = await api.get('/guides/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching guide categories:', error);
    throw error;
  }
};

/**
 * Get content for a specific guide
 * @param {string} category - Category name (e.g., 'guides', 'lore')
 * @param {string} path - Path to the guide file or directory
 * @returns {Promise<Object>} Guide content
 */
export const getGuideContent = async (category, path = '') => {
  try {
    const response = await api.get(`/guides/${category}/${path}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching guide content for ${category}/${path}:`, error);
    throw error;
  }
};

const guidesService = {
  getCategories,
  getGuideContent
};

export default guidesService;
