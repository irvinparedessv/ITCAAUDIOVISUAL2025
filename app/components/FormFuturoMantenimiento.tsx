import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Spinner } from "react-bootstrap";

import { getFuturoMantenimientoById, updateFuturoMantenimiento } from "../services/futuroMantenimientoService";
import { getEquipos } from "../services/equipoService";
import { getTiposMantenimiento } from "../services/tipoMantenimientoService";
import type { FuturoMantenimiento } from "../types/futuroMantenimiento";
import type { Equipo } from "../types/equipo";
import type { TipoMantenimiento } from "../types/tipoMantenimiento";

import FormFuturoMantenimiento from "./FormFuturoMantenimiento";

const FuturoMantenimientoEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [futuroMantenimiento, setFuturoMantenimiento] = useState<FuturoMantenimiento | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tiposMantenimiento, setTiposMantenimiento] = useState<TipoMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          const data = await getFuturoMantenimientoById(Number(id));
          setFuturoMantenimiento(data);
        }
        const [equiposData, tiposData] = await Promise.all([
          getEquipos(),
          getTiposMantenimiento(),
        ]);
        setEquipos(equiposData);
        setTiposMantenimiento(tiposData);
      } catch (error) {
        toast.error("Error cargando los datos del mantenimiento.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (data: FuturoMantenimiento) => {
    try {
      if (id) {
        await updateFuturoMantenimiento(Number(id), data);
        toast.success("Mantenimiento actualizado exitosamente.");
        navigate("/futuros-mantenimientos");
      }
    } catch (error) {
      toast.error("Error al actualizar el mantenimiento.");
    }
  };

  if (loading) return <Spinner animation="border" variant="primary" />;
  if (!futuroMantenimiento) return <div>No se encontró el mantenimiento.</div>;

  return (
    <div>
      <h2>Editar Futuro Mantenimiento</h2>
      <FormFuturoMantenimiento
        onSubmit={handleSubmit}
        initialData={futuroMantenimiento}
        equipos={equipos}
        tiposMantenimiento={tiposMantenimiento}
      />
    </div>
  );
};

export default FuturoMantenimientoEdit;
