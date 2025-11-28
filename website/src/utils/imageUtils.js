/**
 * Utility functions for handling item images with proper fallback
 */

/**
 * Get the appropriate image URL for an item with proper fallback logic
 * @param {Object} item - The item object
 * @param {string} item.name - Item name
 * @param {string} item.category - Item category
 * @param {string} item.image_url - Direct image URL if available
 * @param {string} item.image_path - Direct image path if available
 * @returns {string} The image URL to use
 */
export const getItemImageUrl = (item) => {
  if (!item) return '/images/items/default.png';

  // If we have a direct image URL or path, use it
  if (item.image_url) return item.image_url;
  if (item.image_path) return item.image_path;

  // Generate image path based on item name
  if (item.name) {
    const imageName = item.name.toLowerCase().replace(/\s+/g, '_');
    return `/images/items/${imageName}.png`;
  }

  // Fallback to default
  return '/images/items/default.png';
};

/**
 * Get the appropriate fallback image based on item category
 * @param {string} category - Item category
 * @returns {string} The fallback image URL
 */
export const getItemFallbackImage = (category) => {
  if (!category) return '/images/items/default.png';

  const categoryLower = category.toLowerCase();

  // Map categories to their default images
  const categoryDefaults = {
    'berry': '/images/items/default_berry.png',
    'berries': '/images/items/default_berry.png',
    'antique': '/images/items/default_antique.png',
    'antiques': '/images/items/default_antique.png',
    'egg': '/images/items/default_egg.png',
    'eggs': '/images/items/default_egg.png',
    'evolution': '/images/items/default_evolution.png',
    'evolution_item': '/images/items/default_evolution.png',
    'held_item': '/images/items/default_helditem.png',
    'helditem': '/images/items/default_helditem.png',
    'pastry': '/images/items/default_pastry.png',
    'pastries': '/images/items/default_pastry.png',
    'pokeball': '/images/items/default_pokeball.png',
    'pokeballs': '/images/items/default_pokeball.png',
    'seal': '/images/items/default_seal.png',
    'seals': '/images/items/default_seal.png'
  };

  return categoryDefaults[categoryLower] || '/images/items/default.png';
};

/**
 * Handle image error by setting appropriate fallback
 * @param {Event} e - The error event
 * @param {string} category - Item category for fallback
 */
export const handleItemImageError = (e, category) => {
  e.target.onerror = null; // Prevent infinite loop
  e.target.src = getItemFallbackImage(category);
};

/**
 * Handles map image loading errors by providing fallback images
 * @param {Event} event - The image error event
 * @param {string} fallbackType - Type of fallback ('map', 'default', etc.)
 */
export const handleMapImageError = (event, fallbackType = 'map') => {
  const fallbackImages = {
    map: '/images/maps/map.png',
    default: '/images/default_mon.png',
    trainer: '/images/default_trainer.png'
  };

  const img = event.target;
  
  // Prevent infinite loop if fallback image also fails
  if (img.dataset.fallbackAttempted === 'true') {
    // If even the fallback fails, use a data URL placeholder
    img.src = generatePlaceholderDataUrl(img.alt || 'Map Image', 400, 300);
    return;
  }

  // Mark that we've attempted fallback
  img.dataset.fallbackAttempted = 'true';
  
  // Set the fallback image
  const fallbackSrc = fallbackImages[fallbackType];
  if (fallbackSrc) {
    img.src = fallbackSrc;
  } else {
    // Generate a placeholder if no specific fallback exists
    img.src = generatePlaceholderDataUrl(img.alt || 'Map Image', 400, 300);
  }
};

/**
 * Generates a placeholder image as a data URL
 * @param {string} text - Text to display on placeholder
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Data URL for placeholder image
 */
export const generatePlaceholderDataUrl = (text, width = 400, height = 300) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  // Background color (dark theme)
  ctx.fillStyle = '#1e2532';
  ctx.fillRect(0, 0, width, height);
  
  // Border
  ctx.strokeStyle = '#3d4b5d';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
  
  // Text
  ctx.fillStyle = '#d6a339';
  ctx.font = `${Math.min(width / 20, 20)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Split text into lines if too long
  const maxWidth = width * 0.8;
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + ' ' + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);
  
  // Draw text lines
  const lineHeight = parseInt(ctx.font);
  const startY = height / 2 - (lines.length - 1) * lineHeight / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
  
  return canvas.toDataURL();
};

/**
 * Creates a map image error handler with specific fallback type
 * @param {string} fallbackType - Type of fallback to use
 * @returns {Function} Error handler function
 */
export const createMapImageErrorHandler = (fallbackType = 'map') => {
  return (event) => handleMapImageError(event, fallbackType);
};
