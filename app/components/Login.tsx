import React, { useState, useEffect, forwardRef } from "react";
import { Button, Form, Container, Modal, type ButtonProps } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ForgotPassword from "./auth/ForgotPassword";

const MotionButton = motion(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
    <Button {...props} ref={ref} />
  ))
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    // Solo redirigir si el usuario no está en la página de login
    if (isAuthenticated && window.location.pathname === "/login") {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Por favor intente nuevamente.');
      } else if (err.response?.status === 403) {
        setError('Tu cuenta está inactiva o ha sido eliminada. Contacta al administrador.');
      } else {
        setError('Ocurrió un error inesperado. Intenta más tarde.');
      }
      setIsLoading(false);
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
                <i className="bi bi-exclamation-circle me-2"></i>
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
              <Form.Label className="text-secondary">Correo electrónico</Form.Label>
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
              <Form.Control
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-color-login"
              />
            </motion.div>

            <MotionButton
              type="submit"
              disabled={isLoading}
              className={`w-100 btn primary-btn border-0 ${isLoading ? 'loading' : ''}`}
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
                style={{ cursor: 'pointer' }}
              >
                ¿Olvidó su contraseña?
              </span>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
        animation={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Recuperar Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ForgotPassword />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Login;
