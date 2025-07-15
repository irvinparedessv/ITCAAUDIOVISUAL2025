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
  initialTheme: boolean | null;
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
  const [initialTheme, setInitialTheme] = useState<boolean | null>(null);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        const storedTheme = localStorage.getItem("darkMode");

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        const response = await api.get("/validate-token", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.data.valid) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          if (storedTheme) setInitialTheme(JSON.parse(storedTheme));
          initializeEcho(storedToken);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("darkMode");
          setToken(null);
          setUser(null);
          setInitialTheme(null);
        }
      } catch (error) {
        console.error("[AuthContext] Error al validar token:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("darkMode");
        setToken(null);
        setUser(null);
        setInitialTheme(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredentials();
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "logout") {
        setToken(null);
        setUser(null);
        setInitialTheme(null);
        window.location.href = "/login";
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/login", { email, password });
      const { token: newToken, user: newUser } = response.data;

      try {
        const themePref = await api.get("/user/preferences", {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        const userTheme = themePref.data.darkMode;
        setInitialTheme(userTheme);
        localStorage.setItem("darkMode", JSON.stringify(userTheme));
      } catch (themeError) {
        console.error("Error al obtener preferencias de tema:", themeError);
      }

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
      if (window.Echo) {
        window.Echo.disconnect();
      }

      localStorage.setItem("logout", Date.now().toString());
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("darkMode");
      setToken(null);
      setUser(null);
      setInitialTheme(null);
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
      initialTheme,
      login,
      logout,
      checkAccess,
      setUser,
      updateUser,
    }),
    [token, user, isLoading, isAuthenticated, initialTheme]
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
