import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark';
type Density = 'compact' | 'comfortable' | 'spacious';

interface ThemeApi {
  theme: Theme;
  density: Density;
  isDark: boolean;
  toggleTheme: () => void;
  cycleDensity: () => void;
}

const ThemeContext = createContext<ThemeApi | null>(null);

const THEME_KEY = 'prisma.theme';
const DENSITY_KEY = 'prisma.density';
const densities: Density[] = ['compact', 'comfortable', 'spacious'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [density, setDensity] = useState<Density>(() => {
    const stored = localStorage.getItem(DENSITY_KEY);
    return densities.includes(stored as Density) ? (stored as Density) : 'comfortable';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const cycleDensity = useCallback(() => {
    setDensity((current) => densities[(densities.indexOf(current) + 1) % densities.length]);
  }, []);

  const value = useMemo<ThemeApi>(
    () => ({ theme, density, isDark: theme === 'dark', toggleTheme, cycleDensity }),
    [theme, density, toggleTheme, cycleDensity],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme precisa estar dentro de ThemeProvider');
  return context;
}
