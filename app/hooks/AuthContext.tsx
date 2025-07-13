import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import api from "../api/axios";
import { routeRoles } from "../types/routeRoles";
import type { UserLogin } from "../types/user";
import { initializeEcho } from "../utils/pusher";

type AuthContextType = {
  token: string | null;
  user: UserLogin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<void | {
    requiresPasswordChange: boolean;
    token: string;
    user: UserLogin;
  }>;
  logout: () => Promise<void>;
  checkAccess: (route: string) => boolean;
  setUser: React.Dispatch<React.SetStateAction<UserLogin | null>>;
  updateUser: (updatedFields: Partial<UserLogin>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserLogin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
  console.log("[AuthContext] Cargando credenciales...");
  const loadCredentials = async () => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!storedToken || !storedUser) {
        console.log("[AuthContext] No hay token o usuario");
        setIsLoading(false);
        return;
      }

      const response = await api.get("/validate-token", {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      if (response.data.valid) {
        console.log("[AuthContext] Token válido. Estableciendo usuario.");
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        initializeEcho(storedToken);
      } else {
        console.log("[AuthContext] Token inválido.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error("[AuthContext] Error al validar token:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    } finally {
      console.log("[AuthContext] isLoading = false");
      setIsLoading(false);
    }
  };

  loadCredentials();
}, []);


  // Escuchar cambios en localStorage para detectar logout desde otra pestaña
useEffect(() => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "logout") {
      console.log("Logout detectado desde otra pestaña");

      // Limpiar sesión en esta pestaña
      setToken(null);
      setUser(null);

      // Redirigir al login
      window.location.href = "/login"; // O usa navigate si estás dentro de un componente con router
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}, []);


  useEffect(() => {
    console.log("Valor actual del token:", token);
    console.log("Valor de isAuthenticated:", isAuthenticated);
  }, [token, isAuthenticated]);

  const login = async (email: string, password: string) => {
  
    try {
      const response = await api.post("/login", { email, password });
      const { token: newToken, user: newUser } = response.data;

      if (newUser.estado === 3) {
        return { requiresPasswordChange: true, token: newToken, user: newUser };
      }

      if (newUser.estado !== 1) {
        throw {
          response: {
            status: 403,
            data: { message: "Usuario inactivo" },
          },
        };
      }

      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      initializeEcho(newToken);
    } catch (error) {
      throw error;
    } finally {
    }
  };
const logout = async () => {
  try {
    if (token) {
      await api.post(
        "/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (error) {
    console.warn("Error cerrando sesión en el servidor:", error);
  } finally {
    // Desconectar Laravel Echo
    if (window.Echo) {
      window.Echo.disconnect();
    }

    // Notificar a otras pestañas del logout
    localStorage.setItem("logout", Date.now().toString());

    // Eliminar token del frontend
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }
};

  const checkAccess = (route: string) => {
    if (!user) return false;
    const allowedRoles = routeRoles[route] || [];
    return allowedRoles.length === 0 || allowedRoles.includes(user.role);
  };

  const updateUser = (updatedFields: Partial<UserLogin>) => {
  setUser((prevUser) => {
    if (!prevUser) return prevUser;
    const updatedUser = { ...prevUser, ...updatedFields };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return updatedUser;
  });
};


  const contextValue = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated,
      login,
      logout,
      checkAccess,
      setUser,
      updateUser, 
    }),
    [token, user, isLoading, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
