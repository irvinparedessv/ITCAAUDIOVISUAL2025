import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaSave,
  FaTimes,
  FaKey,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Modal } from "react-bootstrap";
import ForgotPassword from "../auth/ForgotPassword";

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const email = queryParams.get("email");
  const expires = queryParams.get("expires");

  useEffect(() => {
    if (!token || !email) {
      toast.error("El enlace de restablecimiento no es válido");
      navigate("/");
    }
  }, [token, email, navigate]);

  useEffect(() => {
    if (expires) {
      const expirationTime = new Date(parseInt(expires, 10) * 1000);
      const now = new Date();

      if (now > expirationTime) {
        setIsExpired(true);
      }
    }
  }, [expires]);

  // Mostrar el toast sólo cuando isExpired cambie a true
  useEffect(() => {
    if (isExpired) {
      toast.error("El enlace ha expirado. Por favor solicita uno nuevo.");
    }
  }, [isExpired]);

  const validatePassword = (): boolean => {
    if (!password || !passwordConfirm) {
      toast.error("Por favor completa todos los campos", { icon: "⚠️", id: "empty-fields" });
      return false;
    }

    if (password !== passwordConfirm) {
      toast.error("Las contraseñas no coinciden", { icon: "⚠️", id: "password-mismatch" });
      return false;
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres", {
        icon: "⚠️",
        duration: 4000,
        id: "password-too-short",
      });
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
      toast.error(
        "La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales",
        {
          icon: "⚠️",
          duration: 6000,
          id: "password-invalid-format",
        }
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isExpired) return;
    if (!validatePassword()) return;

    if (!token || !email) {
      toast.error("El enlace de restablecimiento no es válido");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
        expires,
      });

      toast.success("¡Contraseña restablecida con éxito!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Hubo un problema al restablecer la contraseña";

      toast.error(errorMessage, {
        icon: "⚠️",
        duration: 5000,
      });

      if (err.response?.status === 400 || err.response?.status === 401) {
        setTimeout(() => setShowForgotModal(true), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/login");
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowPasswordConfirm = () =>
    setShowPasswordConfirm(!showPasswordConfirm);

  return (
    <div className="form-container">
      <h2 className="mb-4 text-center fw-bold">
        <FaKey className="me-2" />
        Restablecer Contraseña
      </h2>

      <p className="text-center mb-4">
        Estás restableciendo la contraseña para: <strong>{email}</strong>
      </p>

      {isExpired && (
        <div className="alert alert-danger text-center mb-4">
          Este enlace ha expirado. Por favor{" "}
          <button
            type="button"
            className="btn btn-link text-danger fw-bold p-0"
            onClick={() => setShowForgotModal(true)}
          >
            solicita uno nuevo
          </button>
          .
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            Nueva Contraseña
          </label>
          <div className="input-group">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres con mayúsculas, minúsculas, números y símbolos"
              disabled={isExpired}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={toggleShowPassword}
              disabled={isExpired}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="passwordConfirm" className="form-label">
            Confirmar Contraseña
          </label>
          <div className="input-group">
            <input
              id="passwordConfirm"
              type={showPasswordConfirm ? "text" : "password"}
              className="form-control"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              placeholder="Repite tu contraseña"
              disabled={isExpired}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={toggleShowPasswordConfirm}
              disabled={isExpired}
            >
              {showPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary-btn"
            disabled={isLoading || isExpired}
          >
            <FaSave className="me-2" />
            {isLoading ? "Procesando..." : "Guardar Nueva Contraseña"}
          </button>

          <button
            type="button"
            className="btn secondary-btn"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal para solicitar nuevo enlace */}
      <Modal
        show={showForgotModal}
        onHide={() => setShowForgotModal(false)}
        centered
      >
        <Modal.Header
          closeButton
          className="text-white"
          style={{
            backgroundColor: "rgb(177, 41, 29)",
            borderBottom: "none",
            padding: "1.5rem",
          }}
        >
          <Modal.Title>Solicitar nuevo enlace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ForgotPassword />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ResetPassword;
