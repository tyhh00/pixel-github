import { NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare/context';
import { saveWorldConfig, ensureUser } from '@/lib/cloudflare/d1';
import { getCurrentUser } from '@/lib/supabase/server';
import type { UserWorldConfig } from '@/types/editor';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();

    if (!user || !user.githubUsername) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json() as Partial<UserWorldConfig>;

    // Validate that user is saving their own world
    if (body.username && body.username.toLowerCase() !== user.githubUsername.toLowerCase()) {
      return NextResponse.json(
        { error: 'Cannot save world for another user' },
        { status: 403 }
      );
    }

    const env = getCloudflareEnv();

    if (!env) {
      return NextResponse.json(
        { error: 'D1 not available', saved: false },
        { status: 503 }
      );
    }

    // Ensure user exists in D1
    await ensureUser(
      env.DB,
      user.id,
      user.githubUsername,
      user.githubId || 0,
      user.avatarUrl
    );

    // Save world config
    await saveWorldConfig(
      env.DB,
      user.id,
      user.githubUsername,
      {
        ...body,
        username: user.githubUsername,
      }
    );

    return NextResponse.json({
      success: true,
      username: user.githubUsername,
    });
  } catch (error) {
    console.error('Error saving world config:', error);
    return NextResponse.json(
      { error: 'Failed to save world config' },
      { status: 500 }
    );
  }
}
