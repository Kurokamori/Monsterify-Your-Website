router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const playerId = req.session.user ? req.session.user.discord_id : null;

    // Get shop items with player-specific remaining quantities
    const items = await DailyShopItems.getShopItems(shopId, today, playerId);

    // Get shop configuration
    const shopConfig = await ShopConfig.getByShopId(shopId);

    if (!shopConfig) {
      return res.status(404).render('error', {
        message: 'Shop not found',
        error: { status: 404 }
      });
    }

    res.render('shop/index', {
      title: `${shopConfig.name} - Shop`,
      shop: shopConfig,
      items: items.map(item => ({
        ...item,
        remaining: item.remaining,
        purchaseLimit: item.purchaseLimit,
        canPurchase: item.canPurchase
      })),
      user: req.session.user
    });
  } catch (error) {
    console.error('Error loading shop:', error);
    res.status(500).render('error', {
      message: 'Error loading shop',
      error: { status: 500, stack: error.stack }
    });
  }
});
