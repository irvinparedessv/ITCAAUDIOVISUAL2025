import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Cargar tema guardado o preferencia del sistema
    const savedMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialMode = savedMode ? JSON.parse(savedMode) : prefersDark;
    setDarkMode(initialMode);
    applyTheme(initialMode);
  }, []);

  const applyTheme = (isDark: boolean) => {
    // 1. Aplicar a documentElement (para Bootstrap)
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    
    // 2. Aplicar clases al body (para tus estilos personalizados)
    document.body.className = isDark ? 'dark-theme' : 'light-theme';
    
    // 3. Actualizar meta tag (opcional)
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', 
      isDark ? '#212529' : '#ffffff'
    );
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", JSON.stringify(newMode));
    applyTheme(newMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
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