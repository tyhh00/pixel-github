import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  const cookieStore = await cookies();

  // Helper to clear Supabase auth cookies on error
  const clearAuthCookies = () => {
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    });
  };

  // Handle OAuth error from provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    clearAuthCookies();
    return NextResponse.redirect(`${origin}/?error=${error}&message=${encodeURIComponent(errorDescription || '')}`);
  }

  if (code) {
    const supabase = createServerClient(
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
              // Handle Server Component context
            }
          },
        },
      }
    );

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (!sessionError) {
      // Get the user to redirect to their profile editor if that was the intent
      const { data: { user } } = await supabase.auth.getUser();
      const githubUsername = user?.user_metadata?.user_name;

      // If the user was trying to access the editor, redirect there
      if (next.includes('/editor') && githubUsername) {
        return NextResponse.redirect(`${origin}/${githubUsername}/editor`);
      }

      // Otherwise redirect to their profile or the specified next URL
      if (githubUsername && next === '/') {
        return NextResponse.redirect(`${origin}/${githubUsername}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Session exchange error:', sessionError);
      clearAuthCookies();
    }
  }

  // Clear cookies and return to home on error
  clearAuthCookies();
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`);
}
