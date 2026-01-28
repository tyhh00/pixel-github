import { createServerClient } from '@supabase/ssr';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Get current user from session (cookie-based)
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    githubUsername: user.user_metadata?.user_name as string | undefined,
    githubId: user.user_metadata?.provider_id as number | undefined,
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
    email: user.email,
  };
}

// Get current user from request (supports both cookies and Authorization header)
// Use this for API routes that may receive cross-origin requests
export async function getCurrentUserFromRequest(request: Request) {
  // First try Authorization header (for cross-origin requests)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      return {
        id: user.id,
        githubUsername: user.user_metadata?.user_name as string | undefined,
        githubId: user.user_metadata?.provider_id as number | undefined,
        avatarUrl: user.user_metadata?.avatar_url as string | undefined,
        email: user.email,
      };
    }
  }

  // Fall back to cookie-based auth (same-origin requests)
  return getCurrentUser();
}

// Check if user owns a profile
export async function isProfileOwner(username: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user?.githubUsername) return false;
  return user.githubUsername.toLowerCase() === username.toLowerCase();
}
