const viewHelpers = {
  formatCategory: (category) => {
    const formatted = category.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  },

  getCategoryBadgeColor: (category) => {
    const categoryColors = {
      general: 'blue',
      potions: 'green',
      berries: 'pink',
      balls: 'red',
      evolution: 'purple',
      antiques: 'yellow',
      pastries: 'orange',
      items: 'teal',
      eggs: 'indigo',
      black_market: 'gray'
    };

    return categoryColors[category] || 'blue';
  },

  getRarityBadgeColor: (rarity) => {
    if (rarity <= 2) return 'gray';
    if (rarity <= 4) return 'blue';
    if (rarity <= 6) return 'green';
    if (rarity <= 8) return 'purple';
    return 'gold';
  }
};

module.exports = viewHelpers;
