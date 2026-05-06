import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorScheme } from '@/lib/colors';

interface ThemeContextValue {
  isDark: boolean;
  toggleTheme: () => void;
  colors: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('theme').then((val) => {
      if (val === 'dark') setIsDark(true);
    });
  }, []);

  function toggleTheme() {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: isDark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
