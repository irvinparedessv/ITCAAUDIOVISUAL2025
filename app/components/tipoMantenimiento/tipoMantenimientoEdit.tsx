import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";
import {
  getTipoMantenimientoById,
  updateTipoMantenimiento,
} from "../../services/tipoMantenimientoService";
import type { TipoMantenimiento } from "../../types/tipoMantenimiento";

export default function TipoMantenimientoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tipo, setTipo] = useState<TipoMantenimiento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nombre, setNombre] = useState("");
  const [estado, setEstado] = useState(true);

  const [errors, setErrors] = useState<{ nombre?: string }>({});

  useEffect(() => {
    if (!id) {
      toast.error("ID inválido");
      navigate("/tipoMantenimiento");
      return;
    }
    setLoading(true);
    getTipoMantenimientoById(Number(id))
      .then((data) => {
        setTipo(data);
        setNombre(data.nombre);
        setEstado(data.estado);
      })
      .catch(() => {
        toast.error("Error al cargar el tipo de mantenimiento");
        navigate("/tipoMantenimiento");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setSaving(true);
    try {
      await updateTipoMantenimiento(Number(id), { nombre: nombre.trim(), estado });
      toast.success("Tipo de mantenimiento actualizado correctamente");
      navigate("/tipoMantenimiento");
    } catch (error: any) {
      // Aquí puedes mejorar según la estructura de error que envíe el backend
      toast.error(error.message || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando tipo de mantenimiento...</p>
      </div>
    );
  }

  if (!tipo) return null;

  return (
    <div className="container mt-4">
      <h2>Editar Tipo de Mantenimiento</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="nombre" className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            isInvalid={!!errors.nombre}
            disabled={saving}
          />
          <Form.Control.Feedback type="invalid">{errors.nombre}</Form.Control.Feedback>
        </Form.Group>

        <Form.Group controlId="estado" className="mb-3">
          <Form.Check
            type="checkbox"
            label="Activo"
            checked={estado}
            onChange={(e) => setEstado(e.target.checked)}
            disabled={saving}
          />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button variant="secondary" onClick={() => navigate("/tipoMantenimiento")} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </Form>
    </div>
  );
}
