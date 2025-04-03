-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
    region_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create areas table
CREATE TABLE IF NOT EXISTS areas (
    area_id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES regions(region_id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_areas_region_id ON areas(region_id);

-- Add owner to tables
ALTER TABLE regions OWNER TO u3f7f8n9i5oagn;
ALTER TABLE areas OWNER TO u3f7f8n9i5oagn;
