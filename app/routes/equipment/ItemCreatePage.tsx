import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTipoEquipos } from "../../services/tipoEquipoService";
import { getTipoReservas } from "../../services/tipoReservaService";
import { createItem, getEstados, getMarcas, getModelos } from "../../services/itemService";
import type { TipoEquipo } from "app/types/tipoEquipo";
import type { TipoReserva } from "app/types/tipoReserva";
import toast from "react-hot-toast";
import type { Estado, Marca, Modelo } from "~/types/item";
import ItemForm from "~/components/equipment/ItemForm";

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  const [tipoReservas, setTipoReservas] = useState<TipoReserva[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tiposData, reservasData, marcasData, modelosData, estadosData] =
          await Promise.all([
            getTipoEquipos(),
            getTipoReservas(),
            getMarcas(),
            getModelos(),
            getEstados()
          ]);

        setTiposEquipo(tiposData);
        setTipoReservas(reservasData);
        setMarcas(marcasData);
        setModelos(modelosData);
        setEstados(estadosData);
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (formData: FormData) => {
  try {
    setLoading(true);
    
    const tipoEquipoId = formData.get('tipo_equipo_id');
    const tipoEquipo = tiposEquipo.find(t => t.id === Number(tipoEquipoId));
    
    if (!tipoEquipo) {
      throw new Error("Tipo de equipo no encontrado");
    }

    const tipo = tipoEquipo.categoria_id === 2 ? "insumo" : "equipo";

    if (tipo === "insumo") {
      const cantidad = formData.get('cantidad');
      if (!cantidad || Number(cantidad) <= 0) {
        throw new Error("La cantidad debe ser mayor a cero");
      }
    }

    // Solo manejar la respuesta aquí, no mostrar toast de éxito
    const response = await createItem(formData, tipo);
    return response; // Devolver la respuesta para que ItemForm la maneje
  } catch (error: any) {
    console.error("Error en handleSubmit:", error);
    throw error; // Relanzar el error para que ItemForm lo maneje
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container mt-4">
      <ItemForm
        loading={loading}
        tiposEquipo={tiposEquipo}
        tipoReservas={tipoReservas}
        marcas={marcas}
        modelos={modelos}
        estados={estados}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
