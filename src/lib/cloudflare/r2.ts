// R2 Storage helpers for Cloudflare Workers

import type { R2Bucket, R2Object } from './context';

// Allowed image types
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Upload an image to R2
export async function uploadImage(
  bucket: R2Bucket,
  username: string,
  file: File,
  type: 'background' | 'asset' = 'background'
): Promise<{ path: string; url: string }> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large: ${file.size} bytes. Max: ${MAX_FILE_SIZE} bytes`);
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const timestamp = Date.now();
  const filename = `${username.toLowerCase()}/${type}-${timestamp}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await bucket.put(filename, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // 1 year cache
    },
    customMetadata: {
      uploadedBy: username,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Return the path and public URL
  const publicUrl = `${process.env.R2_PUBLIC_URL || ''}/${filename}`;

  return {
    path: filename,
    url: publicUrl,
  };
}

// Delete an image from R2
export async function deleteImage(bucket: R2Bucket, path: string): Promise<void> {
  await bucket.delete(path);
}

// List user's images
export async function listUserImages(
  bucket: R2Bucket,
  username: string,
  type?: 'background' | 'asset'
): Promise<R2Object[]> {
  const prefix = type
    ? `${username.toLowerCase()}/${type}-`
    : `${username.toLowerCase()}/`;

  const result = await bucket.list({ prefix, limit: 100 });
  return result.objects;
}

// Check if a path belongs to a user
export function isUserPath(path: string, username: string): boolean {
  return path.toLowerCase().startsWith(`${username.toLowerCase()}/`);
}
