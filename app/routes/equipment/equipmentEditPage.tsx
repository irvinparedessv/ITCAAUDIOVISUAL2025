import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { Equipo, EquipoCreateDTO } from "~/types/equipo";
import EquipoForm from "~/components/equipo/EquipoForm";
import { getEquipoById, updateEquipo } from "~/services/equipoService";
import { Spinner } from "react-bootstrap";

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
          console.log("ID recibido:", id);
          if (!data) {
            toast.error("Equipo no encontrado");
            navigate("/equipolist");
            return;
          }
          setEquipo({
            ...data,
            tipo_reserva_id: data.tipo_reserva_id || 0,
            imagen: data.imagen || '',
            imagen_url: data.imagen_url || undefined
          });
        }


      } catch (error) {
        toast.error("Error al cargar el equipo");
        //navigate("/equipos");
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
  ) => {
    try {
      if (!isEdit || !equipoId) return;

      // Construir los datos del formulario
      const updateData: any = {
        ...data,
        id: equipoId
      };

      // Solo incluir imagen si es un archivo nuevo
      if (data.imagen instanceof File) {
        updateData.imagen = data.imagen;
      }

      await updateEquipo(equipoId, updateData);
      navigate("/equipolist");
    } catch (error) {
      console.error("Error al actualizar equipo:", error);
      toast.error("Error al actualizar el equipo");
    }
  };


  if (loading) {
    return <>
    <div className="text-center my-5">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Cargando datos...</p>
    </div>
    </>
    
  }

  if (!equipo) {
    return <div className="text-center py-8">Equipo no encontrado</div>;
  }

  return (
    <div className="container py-4">

      <EquipoForm
        equipoEditando={equipo}
        onSubmit={handleSubmit}
        resetEdit={() => navigate("/equipolist")}
        onCancel={() => navigate("/equipolist")}
      />
    </div>
  );
}