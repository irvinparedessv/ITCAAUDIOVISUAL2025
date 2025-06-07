import { useEffect, useState } from "react";
import {
  getEquipos,
  createEquipo,
  updateEquipo,
  deleteEquipo,
} from "../services/equipoService";
import { getTipoEquipos } from "../services/tipoEquipoService";
import type { Equipo, EquipoCreateDTO } from "app/types/equipo";
import type { TipoEquipo } from "app/types/tipoEquipo";
import EquipoForm from "../components/equipo/EquipoForm";
import EquipoList from "../components/equipo/EquipoList";

export default function EquipoPage() {
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
  ) => {
    try {
      if (isEdit && id) {
        await updateEquipo(id, data);
      } else {
        await createEquipo(data);
      }
      setEditando(null);
      toggleRecarga();
    } catch (error) {
      console.error("Error al guardar el equipo:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEquipo(id);
      toggleRecarga();
    } catch (error) {
      console.error("Error al eliminar el equipo:", error);
    }
  };

  const handleEdit = (equipo: Equipo) => setEditando(equipo);

  const resetEdit = () => setEditando(null);

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Equipos</h1>

      <EquipoForm
        onSubmit={handleCreateOrUpdate}
        equipoEditando={editando}
        resetEdit={resetEdit}
      />

      <EquipoList
        tipos={tipos}
        onEdit={handleEdit}
        onDelete={handleDelete}
        key={recargarLista ? "reload" : "stable"} // para forzar remount y recarga datos
      />
    </div>
  );
}
