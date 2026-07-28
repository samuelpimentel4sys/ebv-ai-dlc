/**
 * Modos de experiência do FE.
 * - produto (default): IA operacional Prisma Equifax
 * - demo: trilhas, roteiro, JourneyNav, copy de showcase
 * - dev: exibe US-ID e metadados BMAD
 */

export function isDemoMode(search?: string): boolean {
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const params = new URLSearchParams(source);
  if (params.get('demo') === '1' || params.get('mode') === 'demo') return true;
  try {
    return window.localStorage.getItem('prisma.ui.mode') === 'demo';
  } catch {
    return false;
  }
}

export function isDevMode(search?: string): boolean {
  const source = search ?? (typeof window === 'undefined' ? '' : window.location.search);
  const params = new URLSearchParams(source);
  return params.get('dev') === '1' || params.get('mode') === 'dev';
}

export function isProductMode(search?: string): boolean {
  return !isDemoMode(search);
}
