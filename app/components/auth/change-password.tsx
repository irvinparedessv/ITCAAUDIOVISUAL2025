import React, { useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import api from "../../api/axios";
import { useAuth } from "../../hooks/AuthContext";

interface Props {
  email: string;
  currentPassword: string;
  onSuccess: () => void;
}

const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return (
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChars &&
    password.length >= 8
  );
};

const ChangePassword: React.FC<Props> = ({
  email,
  currentPassword,
  onSuccess,
}) => {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales."
      );
      return;
    }

    try {
      await api.post("/change-password", {
        email,
        current_password: currentPassword,
        new_password: password,
        new_password_confirmation: confirmPassword,
      });

      await login(email, password);
      onSuccess();
    } catch (err: any) {
      if (err.response) {
        setError(err.response.data.message || "Error al cambiar la contraseña.");
      } else {
        setError("Error desconocido.");
      }
    }
  };

  return (
    <>
      {error && <div className="alert alert-danger">{error}</div>}
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Nueva Contraseña</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña"
            />
            <Button
              variant=""
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeSlashFill /> : <EyeFill />}
            </Button>
          </InputGroup>
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Confirmar Contraseña</Form.Label>
          <InputGroup>
            <Form.Control
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
            />
            <Button
              variant="outline-secondary"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeSlashFill /> : <EyeFill />}
            </Button>
          </InputGroup>
        </Form.Group>
        <Button type="submit" className="w-100 mt-3">
          Cambiar Contraseña
        </Button>
      </Form>
    </>
  );
};

export default ChangePassword;
