import { getCloudflareEnv } from '@/lib/cloudflare/context';
import { saveWorldConfig, ensureUser } from '@/lib/cloudflare/d1';
import { getCurrentUser } from '@/lib/supabase/server';
import { corsResponse, jsonWithCors } from '@/lib/cors';
import type { UserWorldConfig } from '@/types/editor';

export const runtime = 'edge';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return corsResponse(request);
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();

    if (!user || !user.githubUsername) {
      return jsonWithCors(request, { error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json() as Partial<UserWorldConfig>;

    // Validate that user is saving their own world
    if (body.username && body.username.toLowerCase() !== user.githubUsername.toLowerCase()) {
      return jsonWithCors(
        request,
        { error: 'Cannot save world for another user' },
        { status: 403 }
      );
    }

    const env = getCloudflareEnv();

    if (!env) {
      return jsonWithCors(
        request,
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

    return jsonWithCors(request, {
      success: true,
      username: user.githubUsername,
    });
  } catch (error) {
    console.error('Error saving world config:', error);
    return jsonWithCors(
      request,
      { error: 'Failed to save world config' },
      { status: 500 }
    );
  }
}
