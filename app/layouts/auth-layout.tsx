// layouts/auth-layout.tsx
import { Outlet } from "react-router-dom";
import { AuthProvider } from "../hooks/AuthContext";

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}