import api from './api';

// --- Types ---

export interface ShopInfo {
  shop_id: string;
  name: string;
  description?: string;
  flavor_text?: string;
  banner_image?: string;
  category?: string;
  price_modifier?: number;
  is_constant?: boolean;
  is_active?: boolean;
}

export interface ShopRow {
  id: number;
  shop_id: string;
  name: string;
  description: string | null;
  flavor_text: string | null;
  banner_image: string | null;
  category: string | null;
  price_modifier: number;
  is_constant: boolean;
  is_active: boolean;
  visibility_condition: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisibilityCondition {
  days_of_week?: number[];
  start_date?: string;
  end_date?: string;
  random_chance?: number;
  manually_enabled?: boolean;
}

export interface ShopItemRow {
  id: number;
  shop_id: string;
  item_id: number;
  price: number;
  max_quantity: number | null;
  current_quantity: number | null;
  date: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  category: string;
  type: string | null;
  rarity: string | null;
  effect: string | null;
}

// --- Service ---

const shopService = {
  // ── Public ──────────────────────────────────────────────────────────

  /** Get all visible shops */
  getVisibleShops: async (): Promise<ShopInfo[]> => {
    const response = await api.get('/shops/visible');
    return response.data.data || response.data.shops || response.data || [];
  },

  /** Get shop details by ID */
  getShopById: async (shopId: string): Promise<ShopInfo> => {
    const response = await api.get(`/shops/${shopId}`);
    return response.data.data || response.data;
  },

  // ── Admin: Shops ────────────────────────────────────────────────────

  adminGetAllShops: async (): Promise<ShopRow[]> => {
    const response = await api.get('/shops/');
    return response.data.data || [];
  },

  adminGetShop: async (shopId: string): Promise<ShopRow> => {
    const response = await api.get(`/shops/${shopId}`);
    return response.data.data;
  },

  adminCreateShop: async (data: {
    shop_id: string;
    name: string;
    description?: string;
    flavor_text?: string;
    banner_image?: string;
    category: string;
    price_modifier?: number;
    is_constant?: boolean;
    is_active?: boolean;
    visibility_condition?: string;
  }): Promise<ShopRow> => {
    const response = await api.post('/shops/', data);
    return response.data.data;
  },

  adminUpdateShop: async (shopId: string, data: {
    name: string;
    description?: string;
    flavor_text?: string;
    banner_image?: string;
    category: string;
    price_modifier?: number;
    is_constant?: boolean;
    is_active?: boolean;
    visibility_condition?: string;
  }): Promise<ShopRow> => {
    const response = await api.put(`/shops/${shopId}`, data);
    return response.data.data;
  },

  adminDeleteShop: async (shopId: string): Promise<void> => {
    await api.delete(`/shops/${shopId}`);
  },

  // ── Admin: Shop Items ───────────────────────────────────────────────

  adminGetShopItems: async (shopId: string): Promise<ShopItemRow[]> => {
    const response = await api.get(`/shops/${shopId}/items`);
    return response.data.data || [];
  },

  adminAddShopItem: async (shopId: string, data: {
    item_id: number;
    price: number;
    max_quantity?: number | null;
    current_quantity?: number | null;
  }): Promise<ShopItemRow> => {
    const response = await api.post(`/shops/${shopId}/items`, data);
    return response.data.data;
  },

  adminUpdateShopItem: async (shopId: string, itemId: number, data: {
    price?: number;
    max_quantity?: number | null;
    current_quantity?: number | null;
  }): Promise<ShopItemRow> => {
    const response = await api.put(`/shops/${shopId}/items/${itemId}`, data);
    return response.data.data;
  },

  adminRemoveShopItem: async (shopId: string, itemId: number): Promise<void> => {
    await api.delete(`/shops/${shopId}/items/${itemId}`);
  },

  adminStockShop: async (shopId: string, data: {
    category?: string;
    count?: number;
    price_modifier?: number;
  }): Promise<ShopItemRow[]> => {
    const response = await api.post(`/shops/${shopId}/stock`, data);
    return response.data.data || [];
  },
};

export default shopService;
