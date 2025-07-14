import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../api/axios";
import { useAuth } from './AuthContext';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  loading: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { initialTheme, isAuthenticated } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const applyTheme = (isDark: boolean) => {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      isDark ? '#212529' : '#ffffff'
    );
  };

  useEffect(() => {
    const loadInitialTheme = async () => {
      try {
        if (initialTheme !== null) {
          setDarkMode(initialTheme);
          localStorage.setItem('darkMode', JSON.stringify(initialTheme));
          applyTheme(initialTheme);
          setIsInitialized(true);
          setLoading(false);
          return;
        }

        const savedMode = localStorage.getItem('darkMode');
        if (savedMode !== null) {
          const parsedMode = JSON.parse(savedMode);
          setDarkMode(parsedMode);
          applyTheme(parsedMode);
          setIsInitialized(true);
          setLoading(false);
          return;
        }

        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(systemPrefersDark);
        applyTheme(systemPrefersDark);
      } catch (err) {
        console.error('Error al cargar tema inicial:', err);
        setDarkMode(false);
        applyTheme(false);
      } finally {
        setIsInitialized(true);
        setLoading(false);
      }
    };

    loadInitialTheme();
  }, [initialTheme]);

  // Escuchar cambios de localStorage (multitabs sync)
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'darkMode' && event.newValue !== null) {
        const newVal = JSON.parse(event.newValue);
        setDarkMode(newVal);
        applyTheme(newVal);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;

    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    applyTheme(newMode);
    setIsSyncing(true);

    try {
      if (isAuthenticated) {
        await api.patch('/user/preferences', { dark_mode: newMode });
      }
    } catch (err) {
      console.error('Error al guardar tema en el servidor:', err);
      if (isAuthenticated) {
        const reverted = !newMode;
        setDarkMode(reverted);
        localStorage.setItem('darkMode', JSON.stringify(reverted));
        applyTheme(reverted);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      loading,
      isInitialized,
      isSyncing
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
