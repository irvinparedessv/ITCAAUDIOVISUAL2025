import React, { useState, useEffect, forwardRef } from "react";
import {
  Button,
  Form,
  Container,
  Modal,
  type ButtonProps,
} from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import { InputGroup } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ForgotPassword from "./auth/ForgotPassword";
import ChangePassword from "./auth/change-password";

const MotionButton = motion(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <Button {...props} ref={ref} />
  ))
);

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
  // Estados:
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null);



  useEffect(() => {
    if (isAuthenticated && location.pathname === "/login") {
      navigate("/");
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Limpiar errores anteriores

    try {
      const result = await login(email, password);
      setIsLoading(false);

      if (result?.requiresPasswordChange) {
        setTempCredentials({ email, password });
        setShowChangePasswordModal(true);
        return; // no hagas navigate
      }

    } catch (err: any) {
      setIsLoading(false);
      let msg = "Ocurrió un error inesperado al iniciar sesión.";

      if (err.response?.status === 401) {
        msg = "Credenciales incorrectas. Verifique su correo y contraseña.";
      } else if (err.response?.data?.message) {
        msg = err.response.data.message;
      }

      setError(msg); // Mostrar mensaje en tarjeta de error
    }
  };

  return (
    <div className="login-container">
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-header text-center mb-4">
            <motion.h2
              className="login-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Iniciar Sesión
            </motion.h2>
            <motion.div
              className="header-line"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="alert alert-danger"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >

                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <Form onSubmit={handleSubmit}>
            <motion.div
              className="mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Form.Label className="text-secondary">
                Correo electrónico
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="usuario@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-color-login"
              />
            </motion.div>

            <motion.div
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Form.Label className="text-secondary">Contraseña</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-color-login"
                />
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ borderColor: "#cc3300" }}
                >
                  {showPassword ? <EyeSlashFill /> : <EyeFill />}
                </Button>
              </InputGroup>
            </motion.div>


            <MotionButton
              type="submit"
              disabled={isLoading}
              className={`w-100 btn primary-btn border-0 ${isLoading ? "loading" : ""
                }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                outline: "none",
                boxShadow: "none",
              }}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : (
                <i className="bi bi-box-arrow-in-right me-2"></i>
              )}
              Ingresar
            </MotionButton>
          </Form>

          <motion.div
            className="d-flex justify-content-between mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="text-center mt-3">
              <span
                onClick={() => setShowForgotModal(true)}
                className="text-decoration-none text-secondary fw-semibold"
                style={{ cursor: "pointer" }}
              >
                ¿Olvidó su contraseña?
              </span>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      {/* Modal: Recuperar contraseña */}
      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
        animation={true}
      >
        <Modal.Header closeButton className="text-white"
          style={{
            backgroundColor: "rgb(177, 41, 29)",
            borderBottom: "none",
            padding: "1.5rem",
          }}>
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
        <Modal.Header closeButton
          className="text-white"
          style={{
            backgroundColor: "rgb(177, 41, 29)",
            borderBottom: "none",
            padding: "1.5rem",
          }}>
          <Modal.Title>Cambiar Contraseña Temporal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tempCredentials && (
            <ChangePassword
              email={tempCredentials.email}
              currentPassword={tempCredentials.password}
              onSuccess={() => {
                setShowChangePasswordModal(false);
                navigate("/"); // redirige al home si todo fue bien
              }}
            />
          )}
        </Modal.Body>
      </Modal>



    </div>
  );
};

export default Login;
