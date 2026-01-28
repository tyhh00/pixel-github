'use client';

import { useState, useRef, useEffect } from 'react';
import { Github, ChevronLeft, ChevronRight, RotateCcw, Home, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';

interface TopBarProps {
  username?: string;
}

export function TopBar({ username }: TopBarProps) {
  const router = useRouter();
  const { currentTheme } = useGameStore();
  const { user, isLoading, logout } = useAuthStore();
  const colors = currentTheme.colors;
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    const supabase = createClient();
    const currentPath = window.location.pathname;

    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(currentPath)}`,
        scopes: 'read:user user:email',
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.refresh();
  };

  const goToMyProfile = () => {
    if (user?.githubUsername) {
      router.push(`/${user.githubUsername}`);
    }
    setShowUserMenu(false);
  };

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="backdrop-blur-sm px-4 py-2"
      style={{
        background: colors.navbarBg,
        borderBottom: `3px solid ${colors.navbarBorder}`,
      }}
    >
      <div className="flex items-center gap-3">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <NavButton icon={<ChevronLeft className="w-4 h-4" />} onClick={() => router.back()} colors={colors} />
          <NavButton icon={<ChevronRight className="w-4 h-4" />} onClick={() => router.forward()} colors={colors} />
          <NavButton icon={<RotateCcw className="w-4 h-4" />} onClick={() => router.refresh()} colors={colors} />
          <NavButton icon={<Home className="w-4 h-4" />} onClick={() => router.push('/')} colors={colors} />
        </div>

        {/* URL bar */}
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{
            background: `${colors.navbarText}ee`,
            border: `2px solid ${colors.navbarBorder}44`,
          }}
        >
          <Github className="w-4 h-4" style={{ color: colors.primaryDark }} />
          <span className="text-sm font-mono" style={{ color: colors.primaryDark }}>
            pixel.github /
            <span className="font-semibold" style={{ color: colors.primary }}>
              {username || 'explore'}
            </span>
          </span>
        </div>

        {/* Auth section */}
        <div className="relative" ref={menuRef}>
          {isLoading ? (
            <div
              className="w-8 h-8 rounded-full animate-pulse"
              style={{ background: colors.buttonSecondary }}
            />
          ) : user ? (
            <>
              {/* Logged in - show avatar */}
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg transition-colors"
                style={{
                  background: showUserMenu ? colors.buttonSecondary : 'transparent',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.githubUsername}
                    className="w-7 h-7 rounded-full border-2"
                    style={{ borderColor: colors.accent }}
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: colors.buttonPrimary }}
                  >
                    <User className="w-4 h-4" style={{ color: colors.accent }} />
                  </div>
                )}
                <span
                  className="text-sm font-medium hidden sm:inline"
                  style={{ color: colors.navbarText }}
                >
                  {user.githubUsername}
                </span>
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg overflow-hidden z-50"
                    style={{
                      background: colors.panelBg,
                      border: `2px solid ${colors.navbarBorder}`,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    <button
                      onClick={goToMyProfile}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                      style={{ color: colors.panelText }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <User className="w-4 h-4" />
                      My World
                    </button>
                    <div style={{ height: 1, background: colors.panelBorder }} />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* Not logged in - show login button */
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: `linear-gradient(to bottom, ${colors.buttonPrimaryHover}, ${colors.buttonPrimary})`,
                color: colors.accent,
                border: `2px solid ${colors.accent}`,
              }}
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NavButton({ icon, onClick, colors }: { icon: React.ReactNode; onClick?: () => void; colors: any }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
      style={{
        background: `${colors.navbarBorder}88`,
        color: `${colors.navbarText}cc`,
        border: `1px solid ${colors.navbarBorder}44`,
      }}
    >
      {icon}
    </button>
  );
}
