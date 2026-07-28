import '@testing-library/jest-dom/vitest';

// O tour de primeira visita é validado em teste próprio; nas demais suítes ele já foi visto.
window.localStorage.setItem('prisma.tour', 'visto');

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
