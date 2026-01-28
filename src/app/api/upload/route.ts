import { getCloudflareEnv } from '@/lib/cloudflare/context';
import { uploadImage } from '@/lib/cloudflare/r2';
import { getCurrentUserFromRequest } from '@/lib/supabase/server';
import { corsResponse, jsonWithCors } from '@/lib/cors';

export const runtime = 'edge';

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Handle CORS preflight
export async function OPTIONS(request: Request) {
  return corsResponse(request);
}

export async function POST(request: Request) {
  try {
    // Check authentication (supports both cookies and Authorization header)
    const user = await getCurrentUserFromRequest(request);

    if (!user || !user.githubUsername) {
      return jsonWithCors(request, { error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'background';

    if (!file) {
      return jsonWithCors(request, { error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return jsonWithCors(
        request,
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return jsonWithCors(
        request,
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const env = getCloudflareEnv();

    if (!env) {
      return jsonWithCors(
        request,
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

    return jsonWithCors(request, {
      success: true,
      path: result.path,
      url: result.url,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return jsonWithCors(
      request,
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}
