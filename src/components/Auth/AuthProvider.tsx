'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { fetchSession } = useAuthStore();

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return <>{children}</>;
}
