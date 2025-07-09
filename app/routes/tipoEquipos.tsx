import { useState } from "react";
import {
  deleteTipoEquipo,
} from "../services/tipoEquipoService";
import type { TipoEquipo } from "app/types/tipoEquipo";
import TipoEquipoList from "../components/tipoEquipo/TipoEquipoList";
import { Toaster } from "react-hot-toast";

export default function TipoEquiposPage() {
  const [tipoEditado, setTipoEditado] = useState<TipoEquipo | undefined>();

  const handleDelete = async (id: number) => {
    await deleteTipoEquipo(id);
  };

  return (
    <>
      <Toaster position="top-right" />
      <TipoEquipoList
        onEdit={setTipoEditado}
        onDelete={handleDelete}
        onSuccess={() => {}}
      />
    </>
  );
}
