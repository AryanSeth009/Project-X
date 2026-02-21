import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from '@/lib/theme';

const THEME_STORAGE_KEY = '@app_theme_mode';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedScheme: 'dark' | 'light';
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setModeState(stored);
      }
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => sub.remove();
  }, []);

  const resolvedScheme: 'dark' | 'light' = useMemo(() => {
    if (mode === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemScheme]);

  const colors = useMemo(
    () => (resolvedScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS) as ThemeColors,
    [resolvedScheme]
  );

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
  };

  const value: ThemeContextValue = useMemo(
    () => ({ mode, resolvedScheme, colors, setMode }),
    [mode, resolvedScheme, colors]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { mode: 'system' as ThemeMode, resolvedScheme: 'dark' as const, colors: DARK_COLORS, setMode: () => {} };
  return ctx;
}
