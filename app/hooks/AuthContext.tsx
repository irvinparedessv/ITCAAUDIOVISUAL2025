import React, { createContext, useContext, useEffect, useState } from "react";

// Tipado del contexto
type AuthContextType = {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  token: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  // Recupera el token del localStorage al cargar la página
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true); // Si hay token, el usuario está autenticado
    }
  }, []);

  // Función de login: guarda el token en localStorage y actualiza el estado
  const login = (newToken: string) => {
    localStorage.setItem("token", newToken); // Almacena el token
    setToken(newToken); // Actualiza el estado del token
    setIsAuthenticated(true); // El usuario está autenticado
  };

  // Función de logout: elimina el token de localStorage y actualiza el estado
  const logout = () => {
    localStorage.removeItem("token"); // Elimina el token
    setToken(null); // Resetea el estado del token
    setIsAuthenticated(false); // El usuario ya no está autenticado
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder al contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
