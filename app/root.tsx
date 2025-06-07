import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/AuthContext";
import NavbarMenu from "./components/menu/menu";
import { Spinner } from "react-bootstrap";

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  const hideNavbarRoutes = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/forbidden",
  ];

  const shouldShowNavbar =
    isAuthenticated && !hideNavbarRoutes.includes(location.pathname);

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center vh-100"
        style={{
          backgroundColor: "var(--bs-body-bg)",
          color: "var(--bs-body-color)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        <div className="text-center">
          <Spinner
            animation="border"
            role="status"
            style={{
              width: "3rem",
              height: "3rem",
              color: "var(--bs-primary-bg)",
            }}
          >
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
          <h3 className="mt-3">Cargando...</h3>
          <p>Estamos verificando tu sesión, por favor espera...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
      {shouldShowNavbar && <NavbarMenu />}
      <main className="container my-4">
        <Outlet />
      </main>
    </>
  );
}
