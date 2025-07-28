import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Form, Button, Spinner } from "react-bootstrap";

import { createMantenimiento } from "../services/mantenimientoService";
import { getEquipos } from "../services/equipoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import { getUsuarios } from "../services/userService";

interface EquipoConModelo {
  id: number;
  numero_serie: string;
  modelo?: {
    nombre: string;
  };
}

interface TipoMantenimiento {
  id: number;
  nombre: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
}

const FormMantenimiento: React.FC = () => {
  const [equipos, setEquipos] = useState<EquipoConModelo[]>([]);
  const [tipos, setTipos] = useState<TipoMantenimiento[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);

  const [equipo_id, setEquipoId] = useState<number | "">("");
  const [tipo_id, setTipoId] = useState<number | "">(""); // CAMBIO: nombre de variable consistente
  const [user_id, setUserId] = useState<number | "">("");
  const [fecha_mantenimiento, setFechaMantenimiento] = useState("");
  const [hora_mantenimiento_inicio, setHoraInicio] = useState("");
  const [hora_mantenimiento_final, setHoraFinal] = useState("");
  const [detalles, setDetalles] = useState("");
  const [vida_util, setVidaUtil] = useState<number | "">("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: equiposData } = await getEquipos();
        const tiposData = await getTiposMantenimiento();
        const usuariosResponse = await getUsuarios();

        setEquipos(equiposData);
        setTipos(tiposData);
        setUsuarios(usuariosResponse.data);
      } catch (error) {
        toast.error("Error al cargar datos");
      }
    };
    fetchData();
  }, []);

  // Formatea hora para que tenga segundos "HH:mm:ss"
  const formatTimeWithSeconds = (time: string) => {
    if (!time) return "";
    return time.length === 5 ? time + ":00" : time;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      equipo_id === "" ||
      tipo_id === "" ||
      user_id === "" ||
      fecha_mantenimiento.trim() === "" ||
      hora_mantenimiento_inicio.trim() === "" ||
      hora_mantenimiento_final.trim() === ""
    ) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token") || "";

      await createMantenimiento(token, {
        equipo_id: Number(equipo_id),
        tipo_id: Number(tipo_id), // Envío con el nombre correcto
        user_id: Number(user_id),
        fecha_mantenimiento,
        hora_mantenimiento_inicio: formatTimeWithSeconds(hora_mantenimiento_inicio),
        hora_mantenimiento_final: formatTimeWithSeconds(hora_mantenimiento_final),
        detalles: detalles.trim() || undefined,
        vida_util: vida_util === "" ? undefined : Number(vida_util),
      });

      toast.success("Mantenimiento creado correctamente");
      navigate("/mantenimiento");
    } catch (error) {
      toast.error("Error al crear mantenimiento");
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
      <h2 className="mb-4">Nuevo Mantenimiento</h2>

      {/* Equipo */}
      <Form.Group controlId="equipo" className="mb-3">
        <Form.Label>Equipo</Form.Label>
        <Form.Select
          value={equipo_id}
          onChange={(e) => setEquipoId(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={loading}
          required
        >
          <option value="">Seleccione un equipo</option>
          {equipos.map((equipo) => (
            <option key={equipo.id} value={equipo.id}>
              {equipo.modelo?.nombre} - {equipo.numero_serie}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Tipo de mantenimiento */}
      <Form.Group controlId="tipo_mantenimiento" className="mb-3">
        <Form.Label>Tipo de Mantenimiento</Form.Label>
        <Form.Select
          value={tipo_id}
          onChange={(e) => setTipoId(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={loading}
          required
        >
          <option value="">Seleccione un tipo</option>
          {tipos.map((tipo) => (
            <option key={tipo.id} value={tipo.id}>
              {tipo.nombre}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Usuario */}
      <Form.Group controlId="usuario" className="mb-3">
        <Form.Label>Responsable</Form.Label>
        <Form.Select
          value={user_id}
          onChange={(e) => setUserId(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={loading}
          required
        >
          <option value="">Seleccione un usuario</option>
          {usuarios.map((user) => (
            <option key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {/* Fecha mantenimiento */}
      <Form.Group controlId="fecha_mantenimiento" className="mb-3">
        <Form.Label>Fecha del mantenimiento</Form.Label>
        <Form.Control
          type="date"
          value={fecha_mantenimiento}
          onChange={(e) => setFechaMantenimiento(e.target.value)}
          disabled={loading}
          required
        />
      </Form.Group>

      {/* Hora inicio */}
      <Form.Group controlId="hora_inicio" className="mb-3">
        <Form.Label>Hora de inicio</Form.Label>
        <Form.Control
          type="time"
          value={hora_mantenimiento_inicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          disabled={loading}
          required
        />
      </Form.Group>

      {/* Hora final */}
      <Form.Group controlId="hora_final" className="mb-3">
        <Form.Label>Hora de finalización</Form.Label>
        <Form.Control
          type="time"
          value={hora_mantenimiento_final}
          onChange={(e) => setHoraFinal(e.target.value)}
          disabled={loading}
          required
        />
      </Form.Group>

      {/* Vida útil */}
      <Form.Group controlId="vida_util" className="mb-3">
        <Form.Label>Vida útil (opcional)</Form.Label>
        <Form.Control
          type="number"
          min={0}
          value={vida_util}
          onChange={(e) => {
            const val = e.target.value;
            setVidaUtil(val === "" ? "" : Number(val));
          }}
          disabled={loading}
        />
      </Form.Group>

      {/* Detalles */}
      <Form.Group controlId="detalles" className="mb-4">
        <Form.Label>Detalles (opcional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={detalles}
          onChange={(e) => setDetalles(e.target.value)}
          disabled={loading}
        />
      </Form.Group>

      {/* Botones */}
      <div className="d-flex justify-content-between">
        <Button variant="secondary" disabled={loading} onClick={() => navigate("/mantenimiento")}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </div>
    </Form>
  );
};

export default FormMantenimiento;
