import { NextResponse } from 'next/server';
import { getCloudflareEnv } from '@/lib/cloudflare/context';
import { uploadImage } from '@/lib/cloudflare/r2';
import { getCurrentUser } from '@/lib/supabase/server';

export const runtime = 'edge';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();

    if (!user || !user.githubUsername) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'background';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const env = getCloudflareEnv();

    if (!env) {
      return NextResponse.json(
        { error: 'R2 not available' },
        { status: 503 }
      );
    }

    // Upload to R2
    const result = await uploadImage(
      env.R2_BUCKET,
      user.githubUsername,
      file,
      type as 'background' | 'asset'
    );

    return NextResponse.json({
      success: true,
      path: result.path,
      url: result.url,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}
