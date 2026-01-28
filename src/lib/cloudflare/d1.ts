// D1 Database helpers for Cloudflare Workers
// Note: In local development, use wrangler's D1 binding
// In production, bindings are available via getRequestContext()

import type { UserWorldConfig, CustomTextElement } from '@/types/editor';
import type { D1Database } from './context';

// Get world config for a username
export async function getWorldConfig(
  db: D1Database,
  username: string
): Promise<UserWorldConfig | null> {
  const result = await db
    .prepare(`
      SELECT
        uw.id,
        uw.username,
        uw.base_theme_id as baseThemeId,
        uw.background_image_path as backgroundImagePath,
        uw.world_scale as worldScale,
        uw.custom_colors as customColors,
        uw.slots,
        uw.is_published as isPublished,
        uw.created_at as createdAt,
        uw.updated_at as updatedAt
      FROM user_worlds uw
      WHERE LOWER(uw.username) = LOWER(?)
    `)
    .bind(username)
    .first<{
      id: string;
      username: string;
      baseThemeId: string;
      backgroundImagePath: string | null;
      worldScale: number;
      customColors: string | null;
      slots: string;
      isPublished: number;
      createdAt: number;
      updatedAt: number;
    }>();

  if (!result) {
    return null;
  }

  // Fetch text elements for this world
  const textElementsResult = await db
    .prepare(`
      SELECT
        id,
        x,
        y,
        content,
        font_size as fontSize,
        font_family as fontFamily,
        color,
        background_color as backgroundColor,
        rotation,
        scale,
        z_index as zIndex
      FROM text_elements
      WHERE world_id = ?
      ORDER BY z_index ASC
    `)
    .bind(result.id)
    .all<CustomTextElement>();

  return {
    id: result.id,
    username: result.username,
    baseThemeId: result.baseThemeId || 'woody',
    backgroundImagePath: result.backgroundImagePath || undefined,
    worldScale: result.worldScale || 1.8,
    customColors: result.customColors ? JSON.parse(result.customColors) : undefined,
    slots: JSON.parse(result.slots || '[]'),
    textElements: textElementsResult.results || [],
    isPublished: result.isPublished === 1,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

// Create or update world config
export async function saveWorldConfig(
  db: D1Database,
  userId: string,
  username: string,
  config: Partial<UserWorldConfig>
): Promise<void> {
  const worldId = config.id || crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // Upsert the world config
  await db
    .prepare(`
      INSERT INTO user_worlds (
        id, user_id, username, base_theme_id, background_image_path,
        world_scale, custom_colors, slots, is_published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        base_theme_id = excluded.base_theme_id,
        background_image_path = excluded.background_image_path,
        world_scale = excluded.world_scale,
        custom_colors = excluded.custom_colors,
        slots = excluded.slots,
        is_published = excluded.is_published,
        updated_at = excluded.updated_at
    `)
    .bind(
      worldId,
      userId,
      username.toLowerCase(),
      config.baseThemeId || 'woody',
      config.backgroundImagePath || null,
      config.worldScale || 1.8,
      config.customColors ? JSON.stringify(config.customColors) : null,
      JSON.stringify(config.slots || []),
      config.isPublished ? 1 : 0,
      now,
      now
    )
    .run();

  // Handle text elements - delete existing and insert new ones
  if (config.textElements) {
    // Get the world ID (might be different if this was an insert)
    const world = await db
      .prepare('SELECT id FROM user_worlds WHERE LOWER(username) = LOWER(?)')
      .bind(username)
      .first<{ id: string }>();

    if (world) {
      // Delete existing text elements
      await db
        .prepare('DELETE FROM text_elements WHERE world_id = ?')
        .bind(world.id)
        .run();

      // Insert new text elements
      for (const textElement of config.textElements) {
        await db
          .prepare(`
            INSERT INTO text_elements (
              id, world_id, x, y, content, font_size, font_family,
              color, background_color, rotation, scale, z_index, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            textElement.id || crypto.randomUUID(),
            world.id,
            textElement.x,
            textElement.y,
            textElement.content,
            textElement.fontSize || 16,
            textElement.fontFamily || 'monospace',
            textElement.color || '#ffffff',
            textElement.backgroundColor || null,
            textElement.rotation || 0,
            textElement.scale || 1,
            textElement.zIndex || 0,
            now
          )
          .run();
      }
    }
  }
}

// Ensure user exists in D1 (synced from Supabase)
export async function ensureUser(
  db: D1Database,
  userId: string,
  githubUsername: string,
  githubId: number,
  avatarUrl?: string
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(`
      INSERT INTO users (id, github_username, github_id, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        github_username = excluded.github_username,
        avatar_url = excluded.avatar_url,
        updated_at = excluded.updated_at
    `)
    .bind(userId, githubUsername.toLowerCase(), githubId, avatarUrl || null, now, now)
    .run();
}
