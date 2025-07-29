import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  getFuturoMantenimientoById,
  updateFuturoMantenimiento,
} from "../../services/futuroMantenimientoService";
import { getEquipos } from "../../services/equipoService";
import { getTiposMantenimiento } from "../../services/tipoMantenimientoService";
import { FaSave, FaTimes } from "react-icons/fa";

const futuroMantenimientoEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    equipo_id: "",
    tipo_mantenimiento_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    hora_mantenimiento_final: "",
  });

  const [equipos, setEquipos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [data, equiposList, tiposList] = await Promise.all([
          getFuturoMantenimientoById(Number(id)),
          getEquipos(),
          getTiposMantenimiento(),
        ]);

        setFormData({
          equipo_id: data.equipo_id,
          tipo_mantenimiento_id: data.tipo_mantenimiento_id,
          fecha_mantenimiento: data.fecha_mantenimiento,
          hora_mantenimiento_inicio: data.hora_mantenimiento_inicio,
          hora_mantenimiento_final: data.hora_mantenimiento_final,
        });

        setEquipos(equiposList.data || []);
        setTipos(tiposList.data || tiposList || []);
      } catch (error) {
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
  
    setIsSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        equipo_id: Number(formData.equipo_id),
        tipo_mantenimiento_id: Number(formData.tipo_mantenimiento_id),
        hora_mantenimiento_inicio:
          formData.hora_mantenimiento_inicio.length === 5
            ? formData.hora_mantenimiento_inicio + ":00"
            : formData.hora_mantenimiento_inicio,
        hora_mantenimiento_final:
          formData.hora_mantenimiento_final.length === 5
            ? formData.hora_mantenimiento_final + ":00"
            : formData.hora_mantenimiento_final,
      };
  
      await updateFuturoMantenimiento(Number(id), dataToSend);
      toast.success("Futuro mantenimiento actualizado");
      navigate("/futuroMantenimiento");
    } catch (error: any) {
      console.error("Error al actualizar mantenimiento:", error.response?.data);
      toast.error("Error al actualizar mantenimiento");
    } finally {
      setIsSubmitting(false);
    }
  };
  

  if (loading) {
    return <div className="text-center my-5">Cargando...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Editar Futuro Mantenimiento</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Equipo</label>
          <select
            name="equipo_id"
            className="form-select"
            value={formData.equipo_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione equipo</option>
            {equipos.map((equipo: any) => (
              <option key={equipo.id} value={equipo.id}>
                {equipo.numero_serie}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Tipo de Mantenimiento</label>
          <select
            name="tipo_mantenimiento_id"
            className="form-select"
            value={formData.tipo_mantenimiento_id}
            onChange={handleChange}
            required
          >
            <option value="">Seleccione tipo</option>
            {tipos.map((tipo: any) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            name="fecha_mantenimiento"
            className="form-control"
            value={formData.fecha_mantenimiento}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Hora Inicio</label>
          <input
            type="time"
            name="hora_mantenimiento_inicio"
            className="form-control"
            value={formData.hora_mantenimiento_inicio}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Hora Fin</label>
          <input
            type="time"
            name="hora_mantenimiento_final"
            className="form-control"
            value={formData.hora_mantenimiento_final}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions d-flex gap-2">
  <button
    type="submit"
    className="btn btn-primary"
    disabled={isSubmitting}
  >
    {isSubmitting ? (
      <>
        <span
          className="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        ></span>
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
    className="btn btn-secondary"
    onClick={() => navigate("/futuroMantenimiento")}
    disabled={isSubmitting}
  >
    <FaTimes className="me-2" />
    Cancelar
  </button>
</div>

</form>
    </div>
  );
};

export default futuroMantenimientoEdit;
