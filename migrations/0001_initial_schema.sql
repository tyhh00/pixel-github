-- Pixel GitHub World Builder Schema
-- Run with: wrangler d1 execute pixel-github-db --file=./migrations/0001_initial_schema.sql

-- Users table (synced from Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_username TEXT NOT NULL UNIQUE,
  github_id INTEGER NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- User world configurations
CREATE TABLE IF NOT EXISTS user_worlds (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,

  -- Theme base (null = fully custom)
  base_theme_id TEXT DEFAULT 'woody',

  -- Custom background image (R2 path)
  background_image_path TEXT,

  -- World scale multiplier (1.2 - 2.0)
  world_scale REAL DEFAULT 1.8,

  -- Custom color overrides (JSON string of ThemeColors)
  custom_colors TEXT,

  -- Slot configurations (JSON array of CustomSlotPosition[])
  slots TEXT NOT NULL DEFAULT '[]',

  -- Published state (draft vs public)
  is_published INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Custom text elements placed on the world
CREATE TABLE IF NOT EXISTS text_elements (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL REFERENCES user_worlds(id) ON DELETE CASCADE,

  -- Position as percentage (0-1)
  x REAL NOT NULL,
  y REAL NOT NULL,

  -- Text content
  content TEXT NOT NULL,

  -- Styling
  font_size INTEGER DEFAULT 16,
  font_family TEXT DEFAULT 'monospace',
  color TEXT DEFAULT '#ffffff',
  background_color TEXT,

  -- Transform
  rotation REAL DEFAULT 0,
  scale REAL DEFAULT 1,

  -- Layer ordering
  z_index INTEGER DEFAULT 0,

  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_worlds_username ON user_worlds(username);
CREATE INDEX IF NOT EXISTS idx_user_worlds_user_id ON user_worlds(user_id);
CREATE INDEX IF NOT EXISTS idx_text_elements_world_id ON text_elements(world_id);
