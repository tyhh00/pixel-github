import { getCloudflareEnv } from '@/lib/cloudflare/context';
import { getWorldConfig } from '@/lib/cloudflare/d1';
import { corsResponse, jsonWithCors } from '@/lib/cors';

export const runtime = 'edge';

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return corsResponse(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const env = getCloudflareEnv();

    if (!env) {
      // Local development without D1 - return empty config
      return jsonWithCors(request, {
        customWorld: null,
        message: 'D1 not available in local development',
      });
    }

    const worldConfig = await getWorldConfig(env.DB, username);

    if (!worldConfig) {
      return jsonWithCors(request, { customWorld: null });
    }

    // Only return published worlds for public access
    if (!worldConfig.isPublished) {
      return jsonWithCors(request, { customWorld: null });
    }

    return jsonWithCors(request, { customWorld: worldConfig });
  } catch (error) {
    console.error('Error fetching world config:', error);
    return jsonWithCors(
      request,
      { error: 'Failed to fetch world config' },
      { status: 500 }
    );
  }
}
