import React, { useState } from "react";
import { Button, Form, Container, Alert, Card } from "react-bootstrap";
import api from "../api/axios";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/AuthContext";


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

      login(token);
      setError(null);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="login-background d-flex justify-content-center align-items-center min-vh-100">
      <Container>
        <Card className="p-4 shadow login-card mx-auto">
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
        </Card>
      </Container>
    </div>
  );
};

export default Login;
