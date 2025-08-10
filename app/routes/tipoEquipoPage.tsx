import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTipoEquipoById } from "~/services/tipoEquipoService";
import type { TipoEquipo } from "~/types/tipoEquipo";
import TipoEquipoForm from "~/components/tipoEquipo/TipoEquipoForm";
import { Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import TipoEquipoNoEncontrado from "~/components/error/TipoEquipoNoEncontrado";

export default function TipoEquipoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tipoEditado, setTipoEditado] = useState<TipoEquipo | null>(null);
  const [loading, setLoading] = useState(!!id); // si hay ID, hay que cargar
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTipoEquipo = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const tipo = await getTipoEquipoById(id);
        if (!tipo) {
          setNotFound(true);
          return;
        }
        setTipoEditado(tipo);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Error al cargar el tipo de equipo");
          console.error("Error fetching tipo equipo:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTipoEquipo();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "60vh" }}>
        <Spinner animation="border" role="status" variant="primary" />
        <span className="mt-3">Cargando datos del tipo de equipo...</span>
      </div>
    );
  }

  if (notFound) {
    return <TipoEquipoNoEncontrado />;
  }

  return (
    <TipoEquipoForm
      tipoEditado={tipoEditado ?? undefined}
      onSuccess={() => navigate("/tipoEquipo")}
      onCancel={() => navigate("/tipoEquipo")}
    />
  );
}