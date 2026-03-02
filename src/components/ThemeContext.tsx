import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  getColor: (colorKey: string) => string;
}

// Mapa de colores por tema
const themeColors = {
  dark: {
    primary: '#d8b081',
    primaryHover: '#d8b081',
    primaryDark: '#c4a06d',
    accent: '#d8b081',
    accentAlt: '#d8b081',
    calendarBorder: '#3a3a3a',
    neutralText: '#ffffff',
    grayLight: '#888888',
    grayDarker: '#2a2a2a',
    sidebar: '#111111',
  },
  light: {
    primary: '#5D4037',
    primaryHover: '#6D4C41',
    primaryDark: '#4E342E',
    accent: '#5D4037',
    accentAlt: '#4E342E',
    calendarBorder: '#a68567', // Forzando borde oscuro
    neutralText: '#333333',
    grayLight: '#666666',
    grayDarker: '#dbd8d3',
    sidebar: '#bba8965a',
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('barberia-theme');
    return (savedTheme as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('barberia-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const getColor = (colorKey: string): string => {
    return themeColors[theme][colorKey as keyof typeof themeColors.dark] || themeColors[theme].primary;
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, getColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper para usar directamente en styles inline
export function getThemeColor(theme: Theme, colorKey: string): string {
  return themeColors[theme][colorKey as keyof typeof themeColors.dark] || themeColors[theme].primary;
}
