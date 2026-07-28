import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@/app/ThemeContext';
import { ToastProvider } from '@/ds/Toast';
import { Router } from '@/app/Router';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado');

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
