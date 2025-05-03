import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import axios from "axios";
import { routeRoles } from "~/types/routeRoles";

// Tipado del contexto
type AuthContextType = {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>; // Ahora es async
  logout: () => void;
  token: string | null;
  user: UserLogin | null;
  isLoading: boolean;
  checkAccess: (route: string) => boolean;
};


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserLogin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {

      // 2. Hacer login
      const response = await api.post("/login", { email, password });
  
      const token = response.data.token;
      const user = response.data.user;
  
      // 3. Guardar token y usuario
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
  
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error; // lo manejarás en el componente Login
    }
  };
  

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const checkAccess = (route: string) => {
    if (!user) return false;
    const allowedRoles = routeRoles[route] || [];
    return allowedRoles.length === 0 || allowedRoles.includes(user.role);
  };
  

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token, user, isLoading, checkAccess }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
