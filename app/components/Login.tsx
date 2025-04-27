import React, { useState, forwardRef } from "react";
import api from "../api/axios";
import { Button, Form, Container } from "react-bootstrap";
import type { ButtonProps } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Componente Button animado personalizado
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
  const [activeField, setActiveField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!email || !password) {
      setError('Por favor ingrese su correo y contraseña');
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await api.post('/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (err) {
      setError('Credenciales incorrectas. Por favor intente nuevamente');
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
              className="text-dark"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
             Iniciar Sesión
            </motion.h2>
            <motion.div 
              className="header-line bg-primary"
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
                className="border-primary"
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
                className="border-primary"
              />
            </motion.div>

            <MotionButton 
              type="submit"
              disabled={isLoading}
              className="w-100 bg-primary border-0"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
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
            <a href="/forgot-password" className="text-decoration-none text-secondary">
              ¿Olvidó su contraseña?
            </a>
            <a href="/register" className="text-decoration-none text-primary">
              Crear nueva cuenta
            </a>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
};

export default Login;