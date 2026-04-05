-- Calendar misc entries
CREATE TABLE IF NOT EXISTS calendar_entries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  details TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holiday dates (for dynamic holiday scheduling per year)
CREATE TABLE IF NOT EXISTS holiday_dates (
  id SERIAL PRIMARY KEY,
  holiday VARCHAR(255) NOT NULL,
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (holiday, year)
);

-- Add color column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add start_date and end_date columns to event_parts table
ALTER TABLE event_parts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE event_parts ADD COLUMN IF NOT EXISTS end_date DATE;
