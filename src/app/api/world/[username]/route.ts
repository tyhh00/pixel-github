import { NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare/context';
import { getWorldConfig } from '@/lib/cloudflare/d1';

export const runtime = 'edge';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const env = getCloudflareEnv();

    if (!env) {
      // Local development without D1 - return empty config
      return NextResponse.json({
        customWorld: null,
        message: 'D1 not available in local development',
      });
    }

    const worldConfig = await getWorldConfig(env.DB, username);

    if (!worldConfig) {
      return NextResponse.json({ customWorld: null });
    }

    // Only return published worlds for public access
    if (!worldConfig.isPublished) {
      return NextResponse.json({ customWorld: null });
    }

    return NextResponse.json({ customWorld: worldConfig });
  } catch (error) {
    console.error('Error fetching world config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch world config' },
      { status: 500 }
    );
  }
}
