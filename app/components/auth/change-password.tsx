import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Button, Container } from "react-bootstrap";
import { useAuth } from "~/hooks/AuthContext";
import api from '~/api/axios';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth(); // Obtén el usuario del contexto
  const [password, setPassword] = useState(''); // Contraseña nueva
  const [confirmPassword, setConfirmPassword] = useState(''); // Confirmar nueva contraseña
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const location = useLocation();
  const email = location.state?.email;
  const pass = location.state.password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Verificar si las contraseñas coinciden
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      // Verifica que el correo esté disponible
      if (!email) {
        setError("No se pudo obtener el correo del usuario.");
        return;
      }

      // Cambiar contraseña en el backend
      const response = await api.post('/change-password', {
        email,
        current_password: pass, // Aquí usamos la contraseña del usuario 
        new_password: password, // Nueva contraseña
        new_password_confirmation: confirmPassword, // Confirmación de la nueva contraseña
      });

      // Si el cambio de contraseña fue exitoso, iniciamos sesión automáticamente
      await login(email, password); // Reintenta el login con la nueva contraseña

      setSuccess("Contraseña cambiada y sesión iniciada correctamente.");
      navigate('/'); // Redirige a la página principal después de un cambio exitoso
    } catch (error: any) {
      // Si ocurre un error, muestra el mensaje correspondiente
      if (error.response) {
        setError(error.response.data.message || "Hubo un error al cambiar la contraseña.");
      } else {
        setError("Hubo un error desconocido.");
      }
    }
  };

  return (
    <Container className="mt-5">
      <h2 className="mb-4">Cambiar Contraseña Temporal</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Nueva Contraseña</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa la nueva contraseña"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Confirmar Contraseña</Form.Label>
          <Form.Control
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirma tu nueva contraseña"
          />
        </Form.Group>
        <Button type="submit">Cambiar Contraseña</Button>
      </Form>
    </Container>
  );
};

export default ChangePassword;
