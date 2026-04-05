-- Changelog versions table
CREATE TABLE IF NOT EXISTS changelog_versions (
  id            SERIAL PRIMARY KEY,
  version       VARCHAR(50) NOT NULL UNIQUE,
  title         VARCHAR(255) NOT NULL,
  content       TEXT NOT NULL DEFAULT '',
  is_published  BOOLEAN NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_changelog_versions_published ON changelog_versions (is_published, published_at DESC);
