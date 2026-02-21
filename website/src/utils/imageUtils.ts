/**
 * Utility functions for handling item images with proper fallback
 */

interface ItemWithImage {
  name?: string;
  category?: string;
  image_url?: string;
  image_path?: string;
}

/**
 * Get the appropriate image URL for an item with proper fallback logic
 */
export const getItemImageUrl = (item: ItemWithImage | null | undefined): string => {
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
 */
export const getItemFallbackImage = (category: string | null | undefined): string => {
  if (!category) return '/images/items/default.png';

  const categoryLower = category.toLowerCase();

  // Map categories to their default images
  const categoryDefaults: Record<string, string> = {
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
 */
export const handleItemImageError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  category?: string
): void => {
  const target = e.target as HTMLImageElement;
  target.onerror = null; // Prevent infinite loop
  target.src = getItemFallbackImage(category);
};

/**
 * Handles map image loading errors by providing fallback images
 */
export const handleMapImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackType: 'map' | 'default' | 'trainer' = 'map'
): void => {
  const fallbackImages: Record<string, string> = {
    map: '/images/maps/map.png',
    default: '/images/default_mon.png',
    trainer: '/images/default_trainer.png'
  };

  const img = event.target as HTMLImageElement;

  // Prevent infinite loop if fallback image also fails
  if (img.dataset.fallbackAttempted === 'true') {
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
    img.src = generatePlaceholderDataUrl(img.alt || 'Map Image', 400, 300);
  }
};

/**
 * Generates a placeholder image as a data URL
 */
export const generatePlaceholderDataUrl = (
  text: string,
  width: number = 400,
  height: number = 300
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

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
  const lines: string[] = [];
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
 */
export const createMapImageErrorHandler = (
  fallbackType: 'map' | 'default' | 'trainer' = 'map'
) => {
  return (event: React.SyntheticEvent<HTMLImageElement>) => handleMapImageError(event, fallbackType);
};
