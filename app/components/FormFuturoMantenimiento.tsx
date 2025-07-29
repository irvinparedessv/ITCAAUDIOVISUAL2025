import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFuturoMantenimiento } from "../services/futuroMantenimientoService";
import { getEquipos } from "../services/equipoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import { toast } from "react-hot-toast";
import { FaSave, FaTimes } from "react-icons/fa";

const FormFuturoMantenimiento = () => {
  const navigate = useNavigate();
  const [equipos, setEquipos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    equipo_id: "",
    tipo_mantenimiento_id: "",
    fecha_mantenimiento: "",
    hora_mantenimiento_inicio: "",
    hora_mantenimiento_final: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equiposList, tiposList] = await Promise.all([
          getEquipos(),
          getTiposMantenimiento(),
        ]);
        setEquipos(equiposList.data || []);
        setTipos(tiposList || []);
      } catch (error) {
        toast.error("Error al cargar los datos.");
      }
    };

    fetchData();
  }, []);

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

    try {
      setIsSubmitting(true);

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

      await createFuturoMantenimiento(dataToSend);

      toast.success("Futuro mantenimiento creado con éxito", {
        id: "submit-toast",
        duration: 3000,
        position: "top-right",
      });

      navigate("/futuroMantenimiento");
    } catch (error) {
      toast.error("Error al crear el mantenimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Nuevo Futuro Mantenimiento</h2>
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
                Guardar
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

export default FormFuturoMantenimiento;
