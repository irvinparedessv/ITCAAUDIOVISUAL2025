import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { Equipo, EquipoCreateDTO } from "~/types/equipo";
import EquipmentForm from "~/components/equipment/EquipmentForm";
import { getEquipoById, updateEquipo } from "~/services/equipoService";
import { Spinner } from "react-bootstrap";
import EquipoNoEncontrado from "~/components/error/EquipoNoEncontrado";

export default function EquipmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [equipo, setEquipo] = useState<Equipo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEquipo = async () => {
      try {
        if (id) {
          const data = await getEquipoById(Number(id));
          if (!data) {
            toast.error("Equipo no encontrado");
            setEquipo(null); // explícitamente nulo, aunque ya está
            return;
          }

          setEquipo({
            ...data,
            tipo_reserva_id: data.tipo_reserva_id || 0,
            imagen: data.imagen || "",
            imagen_url: data.imagen_url || undefined,
          });
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          setEquipo(null); // Para mostrar <EquipoNoEncontrado />
        } else {
          toast.error("Error al cargar el equipo");
        }
      } finally {
        setLoading(false);
      }
    };

    loadEquipo();
  }, [id, navigate]);

  const handleSubmit = async (
  data: EquipoCreateDTO,
  isEdit?: boolean,
  equipoId?: number
): Promise<boolean> => {
  try {
    if (!isEdit || !equipoId) return false;

    const updateData: any = {
      ...data,
      id: equipoId,
    };

    if (data.imagen instanceof File) {
      updateData.imagen = data.imagen;
    }

    await updateEquipo(equipoId, updateData);
    navigate("/equipolist");
    return true;
  } catch (error: any) {
    console.error("Error al actualizar equipo:", error);
    
    if (error?.response?.status === 422) {
      const errors = error.response.data.errors;
      if (errors) {
        Object.values(errors).forEach((msgs) => {
          (msgs as string[]).forEach((msg) => {
            toast.error(msg);
          });
        });
      } else {
        toast.error(error.response.data.message || "Error de validación");
      }
    } else {
      toast.error(error?.response?.data?.message || "Error al actualizar el equipo");
    }
    return false;
  }
};

  if (loading) {
    return (
      <>
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      </>
    );
  }

  if (!equipo) {
    return <EquipoNoEncontrado />;
  }

  return (
    <div className="container py-4">
      <EquipmentForm
        equipoEditando={equipo}
        onSubmit={handleSubmit}
        resetEdit={() => navigate("/equipolist")}
        onCancel={() => navigate("/equipolist")}
      />
    </div>
  );
}
