import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTipoMantenimiento } from "../services/tipoMantenimientoService";
import { toast } from "react-hot-toast"; // usa react-hot-toast
import { Form, Button, Spinner } from "react-bootstrap";

const FormTipoMantenimiento: React.FC = () => {
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState(true);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setLoading(true);
    try {
      await createTipoMantenimiento({ nombre: nombre.trim(), estado });
      toast.success("Tipo de mantenimiento creado correctamente");
      navigate("/tipoMantenimiento");
    } catch (error) {
      toast.error("Error al crear tipo de mantenimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      onSubmit={handleSubmit}
      className="mx-auto p-4 bg-white shadow rounded"
      style={{ maxWidth: "480px" }}
    >
      <h2 className="mb-4">Nuevo Tipo de Mantenimiento</h2>

      <Form.Group controlId="nombre" className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          type="text"
          placeholder="Ingrese el nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
          required
        />
      </Form.Group>

      <Form.Group controlId="estado" className="mb-4">
        <Form.Check
          type="checkbox"
          label="Activo"
          checked={estado}
          onChange={(e) => setEstado(e.target.checked)}
          disabled={loading}
        />
      </Form.Group>

      <Button
        type="submit"
        disabled={loading}
        className="w-100"
        variant="primary"
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Creando...
          </>
        ) : (
          "Crear Tipo"
        )}
      </Button>
    </Form>
  );
};

export default FormTipoMantenimiento;
