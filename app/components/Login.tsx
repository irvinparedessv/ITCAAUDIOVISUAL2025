import React, { useState } from "react";
import { Button, Form, Container, Alert } from "react-bootstrap";
import api from "../api/axios";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/AuthContext"; // Asegúrate del path correcto

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    try {
      const response = await api.post('/login', { email, password });
      const token = response.data?.token;

      if (!token) {
        setError('Token no recibido del servidor.');
        return;
      }

      login(token); // ✅ Usamos el contexto
      setError(null);
      navigate('/'); // Redirige después del login
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <h2 className="text-center mb-4">Iniciar sesión</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              placeholder="Ingresa tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="password">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100">
            Iniciar sesión
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Login;
