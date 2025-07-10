import { useState } from "react";
import { Modal, Button, Form, Spinner, InputGroup } from "react-bootstrap";
import { EyeFill, EyeSlashFill } from "react-bootstrap-icons";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function ChangePasswordModal({ show, onHide }: { show: boolean; onHide: () => void }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars && password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (form.new_password !== form.new_password_confirmation) {
      toast.error("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (!validatePassword(form.new_password)) {
      toast.error("La contraseña debe contener mayúscula, minúscula, número, carácter especial y mínimo 8 caracteres");
      setLoading(false);
      return;
    }

   try {
  const res = await api.post("/user/update-password", {
    current_password: form.current_password,
    new_password: form.new_password,
    new_password_confirmation: form.new_password_confirmation,
  });

  toast.success(res.data.message || "Contraseña actualizada con éxito");

  // Cierra sesión si backend lo indica
  if (res.data.logout) {
    setTimeout(() => {
      // Limpia localStorage/sessionStorage si usas token
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // o lo que tengas

      // Redirige al login
      window.location.href = "/login";
    }, 1500); // espera a que el toast se muestre
    return;
  }

  // Reset del formulario si no hay logout automático
  setForm({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  onHide();
} catch (error: any) {
  toast.error(error.response?.data?.message || "Error al cambiar contraseña");
}
finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header    closeButton
        className="text-white"
        style={{
          backgroundColor: "rgb(177, 41, 29)",
          borderBottom: "none",
          padding: "1.5rem",
        }} >
          <Modal.Title className="fw-bold">Cambiar Contraseña</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Contraseña actual */}
          <Form.Group className="mb-3">
            <Form.Label>Contraseña actual</Form.Label>
            <InputGroup>
              <Form.Control
                type={showCurrent ? "text" : "password"}
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
                placeholder="Ingresa tu contraseña actual"
                required
              />
              <Button variant="outline-secondary" onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeSlashFill /> : <EyeFill />}
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Nueva contraseña */}
          <Form.Group className="mb-3">
            <Form.Label>Nueva contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                type={showNew ? "text" : "password"}
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Nueva contraseña segura"
                required
              />
              <Button variant="outline-secondary" onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeSlashFill /> : <EyeFill />}
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Confirmación */}
          <Form.Group>
            <Form.Label>Confirmar nueva contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                type={showConfirm ? "text" : "password"}
                name="new_password_confirmation"
                value={form.new_password_confirmation}
                onChange={handleChange}
                placeholder="Confirma la nueva contraseña"
                required
              />
              <Button variant="outline-secondary" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeSlashFill /> : <EyeFill />}
              </Button>
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : "Guardar cambios"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
