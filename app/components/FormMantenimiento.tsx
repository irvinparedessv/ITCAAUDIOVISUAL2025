import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaTimes } from "react-icons/fa";

import { getEquipos } from "../services/equipoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import { getUsuarios } from "../services/userService";
import { getMantenimientoById, createMantenimiento, updateMantenimiento } from "../services/mantenimientoService";

const FormMantenimiento = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    equipo_id: "",
    tipo_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    hora_mantenimiento_final: "",
    detalles: "",
    user_id: "",
    vida_util: "",
  });

  const [equipos, setEquipos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equiposList, tiposList, usuariosList] = await Promise.all([
          getEquipos(),
          getTiposMantenimiento(),
          getUsuarios(),
        ]);

        setEquipos(equiposList?.data || []);
        setTipos(tiposList || []);
        setUsuarios(usuariosList?.data || []);

        // Si estamos editando, obtener datos de mantenimiento
        if (id) {
          const mantenimiento = await getMantenimientoById(Number(id));
          setFormData({
            equipo_id: mantenimiento.equipo_id?.toString() || "",
            tipo_id: mantenimiento.tipo_id?.toString() || "",
            fecha_mantenimiento: mantenimiento.fecha_mantenimiento || "",
            hora_mantenimiento_inicio: mantenimiento.hora_mantenimiento_inicio?.slice(0,5) || "",
            hora_mantenimiento_final: mantenimiento.hora_mantenimiento_final?.slice(0,5) || "",
            detalles: mantenimiento.detalles || "",
            user_id: mantenimiento.user_id?.toString() || "",
            vida_util: mantenimiento.vida_util?.toString() || "",
          });
        }
      } catch (error) {
        toast.error("Error al cargar datos");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Validar campos requeridos
    if (!formData.equipo_id || !formData.tipo_id || !formData.user_id || !formData.fecha_mantenimiento || !formData.hora_mantenimiento_inicio || !formData.hora_mantenimiento_final) {
      toast.error("Por favor complete todos los campos obligatorios.");
      return;
    }
  
    setIsSubmitting(true);
  
    const dataToSend = {
      ...formData,
      equipo_id: Number(formData.equipo_id),
      tipo_id: Number(formData.tipo_id), // corregido
      user_id: Number(formData.user_id),
      vida_util: formData.vida_util === "" ? null : Number(formData.vida_util),
      hora_mantenimiento_inicio:
        formData.hora_mantenimiento_inicio.length === 5
          ? formData.hora_mantenimiento_inicio + ":00"
          : formData.hora_mantenimiento_inicio,
      hora_mantenimiento_final:
        formData.hora_mantenimiento_final.length === 5
          ? formData.hora_mantenimiento_final + ":00"
          : formData.hora_mantenimiento_final,
    };
    
  
    try {
      const token = localStorage.getItem("token") ?? "";
      if (id) {
        // Si estamos editando, usamos updateMantenimiento
        await updateMantenimiento(Number(id), token, dataToSend);
        toast.success("Mantenimiento actualizado");
      } else {
        // Si estamos creando, usamos createMantenimiento
        await createMantenimiento(token, dataToSend);
        toast.success("Mantenimiento creado");
      }
      navigate("/mantenimiento");
    } catch (error: any) {
      console.error("Error al procesar mantenimiento:", error);
      toast.error("Error al procesar mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <div className="text-center my-5">Cargando...</div>;

  return (
    <div className="container mt-4">
      <h2>{id ? "Editar Mantenimiento" : "Nuevo Mantenimiento"}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Equipo</label>
          <select
            name="equipo_id"
            value={formData.equipo_id}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Seleccione equipo</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id.toString()}>
                {equipo.numero_serie || equipo.nombre || `Equipo #${equipo.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Tipo de Mantenimiento</label>
          <select
            name="tipo_id"
            value={formData.tipo_id}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Seleccione tipo</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id.toString()}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Fecha de mantenimiento</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="mb-3 d-flex gap-3">
          <div className="flex-grow-1">
            <label>Hora inicio</label>
            <input
              type="time"
              name="hora_mantenimiento_inicio"
              value={formData.hora_mantenimiento_inicio}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
          <div className="flex-grow-1">
            <label>Hora fin</label>
            <input
              type="time"
              name="hora_mantenimiento_final"
              value={formData.hora_mantenimiento_final}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>
        </div>

        <div className="mb-3">
          <label>Detalles</label>
          <textarea
            name="detalles"
            value={formData.detalles}
            onChange={handleChange}
            className="form-control"
            rows={3}
          />
        </div>

        <div className="mb-3">
          <label>Responsable (usuario)</label>
          <select
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            required
            className="form-select"
          >
            <option value="">Seleccione usuario</option>
            {usuarios.map((user) => (
              <option key={user.id} value={user.id.toString()}>
                {(user.nombre ?? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()) || `Usuario #${user.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Vida útil (meses)</label>
          <input
            type="number"
            name="vida_util"
            value={formData.vida_util}
            onChange={handleChange}
            min={0}
            className="form-control"
          />
        </div>

        <div className="d-flex gap-2">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Guardar Cambios
              </>
            )}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => navigate("/mantenimiento")}
            className="btn btn-secondary"
          >
            <FaTimes className="me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormMantenimiento;
