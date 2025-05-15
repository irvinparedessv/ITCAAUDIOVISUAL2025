import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import api from "../api/axios";
import { routeRoles } from "~/types/routeRoles";
import type { UserLogin } from "~/types/user";

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
  logout: () => void;
  checkAccess: (route: string) => boolean;
  setUser: React.Dispatch<React.SetStateAction<UserLogin | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserLogin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        const response = await api.get("/validate-token", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (response.data.valid) {
          // Evitar actualizar estado si ya son iguales
          setToken((prev) => (prev !== storedToken ? storedToken : prev));
          setUser((prev) => {
            const parsedUser = JSON.parse(storedUser);
            return JSON.stringify(prev) !== JSON.stringify(parsedUser)
              ? parsedUser
              : prev;
          });
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCredentials();
  }, []);

  useEffect(() => {
    console.log("Valor actual del token:", token);
    console.log("Valor de isAuthenticated:", isAuthenticated);
  }, [token, isAuthenticated]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
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
    }),
    [token, user, isLoading, isAuthenticated]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};
