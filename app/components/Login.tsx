import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Container,
  Modal,
  InputGroup,
  Alert,
} from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import ForgotPassword from "./auth/ForgotPassword";
import ChangePassword from "./auth/change-password";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    // Forzar modo claro en login
    document.documentElement.setAttribute("data-bs-theme", "light");
    document.body.className = "light-theme";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", "#ffffff");
  }, []);



  useEffect(() => {
    if (isAuthenticated && location.pathname === "/login") {
      navigate("/");
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      setIsLoading(false);

      if (result?.requiresPasswordChange) {
        setTempCredentials({ email, password });
        setShowChangePasswordModal(true);
        return;
      }

      navigate("/");

    } catch (err: any) {
      setIsLoading(false);
      let msg = "Ocurrió un error inesperado al iniciar sesión.";
      if (err.response?.status === 401) {
        msg = "Credenciales incorrectas. Verifique su correo y contraseña.";
      } else if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        msg = Object.values(errors).flat().join(" ");
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }
      setError(msg);
    }
  };

  return (
    // <div
    //   className="login-container"
    //   style={{
    //     minHeight: "100vh",
    //     display: "flex",
    //     alignItems: "center",
    //     justifyContent: "center",
    //     padding: "1rem",
    //   }}
    // >
    <div
      className="login-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundImage: 'url("https://www.itca.edu.sv/wp-content/uploads/2016/11/santatecla.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Container
        style={{
          maxWidth: "400px",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 0 15px rgba(0,0,0,0.1)",
        }}
      >
        <div className="text-center mb-4">
          <img
            src="/images/logo.png"
            alt="Logo ReservasTI"
            style={{ height: "50px", marginBottom: "1rem", objectFit: "contain" }}
          />
          <h2 style={{ fontWeight: "700", color: "#b1291d" }}>Iniciar Sesión</h2>
          <hr style={{ borderColor: "#b1291d", width: "60px", margin: "10px auto 0" }} />
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label className="text-secondary">Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              placeholder="usuario@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              isInvalid={!!error}
            />
          </Form.Group>

          <Form.Group controlId="formPassword" className="mb-4">
            <Form.Label className="text-secondary">Contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                isInvalid={!!error}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                style={{ borderColor: "#dededeff" }}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeSlashFill /> : <EyeFill />}
              </Button>
            </InputGroup>
          </Form.Group>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-100"
            style={{
              backgroundColor: "#b1291d",
              borderColor: "#b1291d",
              fontWeight: "600",
              padding: "0.5rem",
            }}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : (
              <i className="bi bi-box-arrow-in-right me-2"></i>
            )}
            Ingresar
          </Button>
        </Form>

        <div className="text-center mt-3">
          <Button variant="link" onClick={() => setShowForgotModal(true)} style={{ color: "#b1291d", fontWeight: "600", textDecoration: "none" }}>
            ¿Olvidó su contraseña?
          </Button>
        </div>
      </Container>

      {/* Modal: Recuperar contraseña */}
      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
        animation={true}
      >
        <Modal.Header closeButton className="text-white" style={{ backgroundColor: "#b1291d", borderBottom: "none", padding: "1.5rem" }}>
          <Modal.Title>Recuperar Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ForgotPassword />
        </Modal.Body>
      </Modal>

      {/* Modal: Cambiar contraseña temporal */}
      <Modal
        show={showChangePasswordModal}
        onHide={() => setShowChangePasswordModal(false)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="text-white" style={{ backgroundColor: "#b1291d", borderBottom: "none", padding: "1.5rem" }}>
          <Modal.Title>Cambiar Contraseña Temporal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tempCredentials && (
            <ChangePassword
              email={tempCredentials.email}
              currentPassword={tempCredentials.password}
              onSuccess={() => {
                setShowChangePasswordModal(false);
                navigate("/");
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Login;
