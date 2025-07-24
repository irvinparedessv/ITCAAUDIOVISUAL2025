// src/pages/TipoEquipoPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTipoEquipoById } from "~/services/tipoEquipoService";
import type { TipoEquipo } from "~/types/tipoEquipo";
import TipoEquipoForm from "~/components/tipoEquipo/TipoEquipoForm";

export default function TipoEquipoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tipoEditado, setTipoEditado] = useState<TipoEquipo | null>(null);
  const [loading, setLoading] = useState(!!id); // si hay ID, hay que cargar

  useEffect(() => {
    if (id) {
      getTipoEquipoById(id).then((res) => {
        setTipoEditado(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando datos del tipo...</p>
      </div>
    );
  }

  return (
    <TipoEquipoForm
      tipoEditado={tipoEditado ?? undefined}
      onSuccess={() => navigate("/tipoEquipo")}
      onCancel={() => navigate("/tipoEquipo")}
    />
  );
}
