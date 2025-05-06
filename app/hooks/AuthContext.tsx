import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import { routeRoles } from "~/types/routeRoles";
 // Asegúrate de importar tu tipo User

// 1. Tipado del contexto (sin isAuthenticated como estado independiente)
type AuthContextType = {
  token: string | null;
  user: UserLogin | null;
  isLoading: boolean;
  isAuthenticated: boolean; // Derivado de !!token
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAccess: (route: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null); // Fuente de verdad
  const [user, setUser] = useState<UserLogin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // isAuthenticated es derivado (evita estados redundantes)
  const isAuthenticated = !!token;

  // 2. Efecto para cargar credenciales al inicio (solo una ejecución)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []); // Sin dependencias = solo al montar

  // 3. Login optimizado (con manejo de carga)
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/login", { email, password });
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      throw error; // Maneja el error en el componente Login
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Logout síncrono (sin esperar)
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); // <-- Añade esto
    setToken(null);
    setUser(null); // <-- Asegúrate de resetear el estado
  };

  // 5. Verificación de permisos
  const checkAccess = (route: string) => {
    if (!user) return false;
    const allowedRoles = routeRoles[route] || [];
    return allowedRoles.length === 0 || allowedRoles.includes(user.role);
  };

  // 6. Proveedor del contexto
  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        isAuthenticated, // Derivado
        login,
        logout,
        checkAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};