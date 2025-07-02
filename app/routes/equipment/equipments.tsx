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
import EquipoForm from "../../components/equipo/EquipoForm";
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
  data: EquipoCreateDTO | EquipoUpdateDTO,
  isEdit?: boolean,
  id?: number
) => {
  try {
    if (isEdit && id) {
      // Aseguramos que data tiene el id para actualización
      const updateData: EquipoUpdateDTO = {
        ...data,
        id: id // Añadimos el id si no está presente
      };
      await updateEquipo(id, updateData);
    } else {
      // Para creación, eliminamos el id si existe
      const { id: _, ...createData } = data as any;
      await createEquipo(createData as EquipoCreateDTO);
    }
    setEditando(null);
    toggleRecarga();
  } catch (error) {
    console.error("Error al guardar el equipo:", error);
    // Puedes agregar manejo de errores más específico aquí
    toast.error("Error al guardar el equipo");
  }
};

  const resetEdit = () => setEditando(null);

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">

      <EquipoForm
        onSubmit={handleCreateOrUpdate}
        equipoEditando={editando}
        resetEdit={resetEdit}
      />

    </div>
  );
}
