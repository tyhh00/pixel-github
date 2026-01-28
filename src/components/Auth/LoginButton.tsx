'use client';

import { Github } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/gameStore';

interface LoginButtonProps {
  returnTo?: string;
}

export function LoginButton({ returnTo }: LoginButtonProps) {
  const { currentTheme } = useGameStore();
  const colors = currentTheme.colors;

  const handleLogin = async () => {
    const supabase = createClient();

    const redirectTo = returnTo
      ? `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(returnTo)}`
      : `${window.location.origin}/api/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
      },
    });
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
      style={{
        background: `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`,
        color: colors.accent,
        border: `2px solid ${colors.accent}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <Github className="w-4 h-4" />
      <span>Sign in with GitHub</span>
    </button>
  );
}
