import React, { createContext, useContext, useState, useEffect } from 'react';
import api from "../api/axios";

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  loading: boolean; // Añade un estado de carga
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true); // Estado para manejar la carga inicial

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await api.get('/user/preferences');
        setDarkMode(data.darkMode);
        applyTheme(data.darkMode);
      } catch (err) {
        console.error('Error loading theme from API:', err);
        // Si hay error, usa las preferencias del sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        applyTheme(prefersDark);
        
        // Intenta guardar las preferencias del sistema en la base de datos
        try {
          await api.patch('/user/preferences', { dark_mode: prefersDark });
        } catch (saveErr) {
          console.error('Error saving system theme preference:', saveErr);
        }
      } finally {
        setLoading(false); // Marca la carga como completada
      }
    };
    loadTheme();
  }, []);

  const applyTheme = (isDark: boolean) => {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      isDark ? '#212529' : '#ffffff'
    );
  };

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    applyTheme(newMode);

    try {
      await api.patch('/user/preferences', { dark_mode: newMode });
    } catch (err) {
      console.error('Error updating theme on server:', err);
      // Revertir el cambio si falla la actualización
      setDarkMode(!newMode);
      applyTheme(!newMode);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, loading }}>
      {!loading && children} {/* Solo renderiza los hijos cuando la carga ha terminado */}
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