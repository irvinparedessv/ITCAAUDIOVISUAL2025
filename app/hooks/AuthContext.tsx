import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import { routeRoles } from "~/types/routeRoles";
import type { UserLogin } from "~/types/user";

type AuthContextType = {
  token: string | null;
  user: UserLogin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAccess: (route: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserLogin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isAuthenticated = !!token;

  // Cargar credenciales al inicio
// En el useEffect que carga las credenciales
useEffect(() => {
  const loadCredentials = async () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    try {
      // Verificar el token con el backend
      const response = await api.get("/validate-token", {
        headers: { Authorization: `Bearer ${storedToken}` }
      });

      if (response.data.valid) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  loadCredentials();
}, []);
  

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
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const checkAccess = (route: string) => {
    if (!user) return false;
    const allowedRoles = routeRoles[route] || [];
    return allowedRoles.length === 0 || allowedRoles.includes(user.role);
  };

  // Memoizar el valor del contexto para evitar renders innecesarios
  const contextValue = useMemo(() => ({
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAccess,
  }), [token, user, isLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};