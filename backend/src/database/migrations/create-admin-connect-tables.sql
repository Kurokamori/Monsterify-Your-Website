-- Admin Connect: task/bug tracking visible to all users, managed by admins

CREATE TABLE IF NOT EXISTS admin_connect_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  secret_name VARCHAR(255),
  is_secret BOOLEAN NOT NULL DEFAULT false,
  category VARCHAR(50) NOT NULL DEFAULT 'misc',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  urgency VARCHAR(20) NOT NULL DEFAULT 'normal',
  difficulty VARCHAR(20) NOT NULL DEFAULT 'normal',
  progress INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  data_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_connect_sub_items (
  id SERIAL PRIMARY KEY,
  item_id INTEGER NOT NULL REFERENCES admin_connect_items(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_connect_items_category ON admin_connect_items(category);
CREATE INDEX IF NOT EXISTS idx_admin_connect_items_status ON admin_connect_items(status);
CREATE INDEX IF NOT EXISTS idx_admin_connect_items_priority ON admin_connect_items(priority);
CREATE INDEX IF NOT EXISTS idx_admin_connect_sub_items_item_id ON admin_connect_sub_items(item_id);
