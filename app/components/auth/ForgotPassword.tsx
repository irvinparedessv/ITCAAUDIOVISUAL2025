import React, { useState } from "react";
import api from "../../api/axios";
import { Button, Form, Spinner } from "react-bootstrap";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false); // Nuevo estado para controlar el loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Activar el spinner
    try {
      const response = await api.post("/forgot-password", { email });
      setMessage(response.data.message);
      setError("");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Hubo un problema, intenta de nuevo."
      );
      setMessage("");
    } finally {
      setIsLoading(false); // Desactivar el spinner una vez completada la solicitud
    }
  };

  return (
    <div className="">
      <Form onSubmit={handleSubmit} className="forgot-password-form">
        <Form.Group className="mb-3" controlId="email">
          <Form.Label className="text-muted">Correo electrónico</Form.Label>
          <Form.Control
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
          />
        </Form.Group>

        <Button
          type="submit"
          className="w-100 btn primary-btn border-0"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <Spinner animation="border" size="sm" /> // Spinner de carga
          ) : (
            "Enviar enlace de restablecimiento"
          )}
        </Button>
      </Form>

      {message && <p className="response-message success">{message}</p>}
      {error && <p className="response-message error">{error}</p>}
    </div>
  );
};

export default ForgotPassword;
