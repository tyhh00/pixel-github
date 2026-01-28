import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Check if this is an editor route: /[username]/editor
  const editorMatch = pathname.match(/^\/([^/]+)\/editor$/);

  if (editorMatch) {
    const requestedUsername = editorMatch[1];

    // Skip protection for special routes
    if (['api', '_next', 'favicon.ico'].includes(requestedUsername)) {
      return supabaseResponse;
    }

    if (!user) {
      // Not logged in - redirect to home with login prompt
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('login', 'required');
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if logged-in user owns this profile
    const githubUsername = user.user_metadata?.user_name as string | undefined;

    if (!githubUsername || githubUsername.toLowerCase() !== requestedUsername.toLowerCase()) {
      // Not the owner - redirect to the profile view
      return NextResponse.redirect(new URL(`/${requestedUsername}`, request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
