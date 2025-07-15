import { useEffect, useState } from "react";
import {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} from "../../services/equipoService";
import { getTipoEquipos } from "../../services/tipoEquipoService";
import type { Equipo, EquipoCreateDTO, EquipoUpdateDTO } from "app/types/equipo";
import type { TipoEquipo } from "app/types/tipoEquipo";
import EquipmentForm from "../../components/equipment/EquipmentForm";
import toast from "react-hot-toast";

export default function EquipmentPage() {
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [editando, setEditando] = useState<Equipo | null>(null);
  const [recargarLista, setRecargarLista] = useState(false);

  const cargarTipos = async () => {
    try {
      const tiposData = await getTipoEquipos();
      setTipos(tiposData);
    } catch (error) {
      console.error("Error al cargar los tipos:", error);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  // Para forzar recarga lista de equipos después de crear/editar/eliminar
  const toggleRecarga = () => setRecargarLista((v) => !v);

const handleCreateOrUpdate = async (
  data: EquipoCreateDTO,
  isEdit?: boolean,
  id?: number
): Promise<boolean> => {
  try {
    if (isEdit && id) {
      const updateData: EquipoUpdateDTO = {
        ...data,
        id: id
      };
      await updateEquipo(id, updateData);

    } else {
      await createEquipo(data);
    }
    setEditando(null);
    toggleRecarga();
    return true; // Indicar éxito
  } catch (error: any) {
    console.error("Error al guardar el equipo:", error);
    
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
      toast.error(error?.response?.data?.message || "Error al guardar el equipo");
    }
    return false; // Indicar fallo
  }
};

  const resetEdit = () => setEditando(null);

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">

      <EquipmentForm
        onSubmit={handleCreateOrUpdate}
        equipoEditando={editando}
        resetEdit={resetEdit}
      />

    </div>
  );
}
