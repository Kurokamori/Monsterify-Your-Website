-- Rebuild faction_stores table
-- Drops all legacy columns (item_name, item_description, item_type, item_category,
-- stock_quantity, currency_type, etc.) and replaces item identity with a proper FK to items.

DROP TABLE IF EXISTS faction_stores;

CREATE TABLE faction_stores (
  id                  SERIAL PRIMARY KEY,
  faction_id          INTEGER NOT NULL REFERENCES factions(id) ON DELETE CASCADE,
  item_id             INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  price               INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0 AND price <= 1000),
  standing_requirement INTEGER NOT NULL DEFAULT 0,
  title_id            INTEGER REFERENCES faction_titles(id) ON DELETE SET NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faction_stores_faction_id ON faction_stores(faction_id);
CREATE INDEX idx_faction_stores_item_id    ON faction_stores(item_id);
