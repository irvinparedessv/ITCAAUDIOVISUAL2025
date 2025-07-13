import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../api/axios";

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => Promise<void>;
  loading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Leer de localStorage primero, luego preferencias del sistema
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) return JSON.parse(savedMode);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [loading, setLoading] = useState(true);

  const applyTheme = (isDark: boolean) => {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      isDark ? '#212529' : '#ffffff'
    );
  };

  // Aplicar tema al inicio (desde localStorage o sistema)
  useEffect(() => {
    applyTheme(darkMode);
  }, []);

  // 2. Consultar API y actualizar si hay cambios
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await api.get('/user/preferences');
        if (data.darkMode !== darkMode) {
          setDarkMode(data.darkMode);
          localStorage.setItem('darkMode', JSON.stringify(data.darkMode)); // Actualizar caché
          applyTheme(data.darkMode);
        }
      } catch (err) {
        console.error('Error al cargar tema:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [darkMode]);

  // 3. Actualizar localStorage + API al cambiar tema
  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    
    // Cambio inmediato (localStorage + UI)
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    applyTheme(newMode);

    // Sincronización con API (en segundo plano)
    try {
      await api.patch('/user/preferences', { dark_mode: newMode });
    } catch (err) {
      console.error('Error al guardar tema:', err);
      // Opcional: Revertir si prefieres consistencia absoluta con la API
      // setDarkMode(!newMode);
      // localStorage.setItem('darkMode', JSON.stringify(!newMode));
      // applyTheme(!newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
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