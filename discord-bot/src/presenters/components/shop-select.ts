import { SHOPS, type ShopDefinition } from '../../constants/shops.js';
import type { ShopItem } from '../../services/market.service.js';
import {
  buildPaginatedSelect,
  type PaginatedSelectResult,
  type SelectOption,
} from './select-menus.js';

// ============================================================================
// Shop menu select (choose which shop to visit)
// ============================================================================

function formatShopOption(
  shop: ShopDefinition,
  _index: number,
): SelectOption {
  return {
    label: shop.name,
    value: shop.id,
    description: shop.description,
    emoji: shop.emoji,
  };
}

/**
 * Build a select menu of available shops.
 *
 * Shops are a static list that fits well within 25 options, but
 * pagination is supported for forward-compatibility.
 *
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `shop_select`).
 * @param shops     - Override the default shop list (e.g. for filtering).
 */
export function shopSelect(
  page = 1,
  customId = 'shop_select',
  shops: ShopDefinition[] = SHOPS,
): PaginatedSelectResult {
  return buildPaginatedSelect(shops, formatShopOption, {
    customId,
    placeholder: 'Choose a shop to visit...',
    page,
    paginationPrefix: `${customId}_page`,
  });
}

// ============================================================================
// Shop item select (browse items within a shop)
// ============================================================================

function formatShopItemOption(
  item: ShopItem,
  _index: number,
): SelectOption {
  const priceText = `${item.price.toLocaleString()} coins`;
  const stock =
    item.currentQuantity !== null ? ` | Stock: ${item.currentQuantity}` : '';
  const rarity = item.rarity ? ` [${item.rarity}]` : '';

  return {
    label: item.name,
    value: String(item.id),
    description: `${priceText}${stock}${rarity}`,
    emoji: '🏷️',
  };
}

/**
 * Build a paginated select menu of items within a shop.
 *
 * Shops can stock more than 25 items, so pagination is essential here.
 *
 * @param items     - Shop items fetched via `marketService.getShopItems`.
 * @param page      - 1-based page number.
 * @param customId  - Custom ID for the select menu (default `shop_item_select`).
 */
export function shopItemSelect(
  items: ShopItem[],
  page = 1,
  customId = 'shop_item_select',
): PaginatedSelectResult {
  return buildPaginatedSelect(items, formatShopItemOption, {
    customId,
    placeholder: 'Browse shop items...',
    page,
    paginationPrefix: `${customId}_page`,
  });
}
