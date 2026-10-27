import type { ReactNode } from 'react';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { AuthProvider } from '@/lib/auth/AuthContext';

/** Providers da app para RTL (mock mode: OIDC não obrigatório). */
export function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
