import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/AuthContext";
import NavbarMenu from "./components/menu/menu";
import { Spinner } from "react-bootstrap";
import { ThemeProvider, useTheme } from "./hooks/ThemeContext"; // Ajusta la ruta

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { darkMode } = useTheme();

  useEffect(() => {
    // Script Pannellum
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.async = true;
    document.body.appendChild(script);

    // CSS Pannellum
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);
  const hideNavbarRoutes = ["/login", "/reset-password", "/forbidden"];

  const shouldShowNavbar =
    isAuthenticated && !hideNavbarRoutes.includes(location.pathname);

  // Puedes usar `theme` para condicionar algo, por ejemplo:
  console.log("Tema actual:", darkMode);

  return (
    <>
      {shouldShowNavbar && <NavbarMenu />}
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <AppContent />
    </ThemeProvider>
  );
}
