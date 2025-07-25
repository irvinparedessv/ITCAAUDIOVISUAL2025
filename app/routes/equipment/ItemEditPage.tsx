import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import ItemEditForm from "~/components/equipment/ItemEditForm";
import {
  getItemById,
  updateItem,
  getMarcas,
  getModelos,
  getEstados,
  getValoresCaracteristicasPorEquipo,
  actualizarValoresCaracteristicasPorEquipo,
} from "~/services/itemService";
import type { Estado, Item, Marca, Modelo } from "~/types/item";
import type { TipoReserva } from "~/types/tipoReserva";
import { getTipoEquipos } from "~/services/tipoEquipoService";
import { getTipoReservas } from "~/services/tipoReservaService";
import type { TipoEquipo, CaracteristicaConValor } from "~/types/tipoEquipo";

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [tiposEquipo, setTiposEquipo] = useState<TipoEquipo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [tipoReservas, setTipoReservas] = useState<TipoReserva[]>([]);
  const [caracteristicas, setCaracteristicas] = useState<CaracteristicaConValor[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [marcasRes, modelosRes, estadosRes, tiposEquipoRes, reservasRes] = await Promise.all([
          getMarcas(),
          getModelos(),
          getEstados(),
          getTipoEquipos(),
          getTipoReservas(),
        ]);
        setMarcas(marcasRes);
        setModelos(modelosRes);
        setEstados(estadosRes);
        setTiposEquipo(tiposEquipoRes);
        setTipoReservas(reservasRes);
      } catch {
        toast.error("Error cargando datos para el formulario.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        setLoading(true);
        const tipo = await detectTipoItem(Number(id));
        const fetchedItem = await getItemById(Number(id), tipo);
        setItem(fetchedItem);

        if (tipo === "equipo") {
          const valores = await getValoresCaracteristicasPorEquipo(Number(id));
          setCaracteristicas(valores); // Pasamos directamente los valores de la API
        }
      } catch {
        toast.error("No se pudo cargar el ítem.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleUpdate = async (formData: any) => {
  try {
    setLoading(true);
    const tipo: "equipo" | "insumo" = item?.tipo || "equipo";
    // Actualizar datos básicos del item
    const response = await updateItem(Number(id), formData, tipo);

    // Actualizar características si es equipo y vienen en formData
    if (tipo === "equipo" && formData.caracteristicas) {
      await actualizarValoresCaracteristicasPorEquipo(Number(id), formData.caracteristicas);
    }

    // Actualizar localmente el estado (opcional)
    const valoresActualizados = await getValoresCaracteristicasPorEquipo(Number(id));
    setCaracteristicas(valoresActualizados);
 console.log('Respuesta del servidor:', response);
    toast.success("Ítem actualizado correctamente");
    navigate("/inventario"); // Si quieres navegar después
  } catch (error: any) {
    console.error('Error en la actualización:', error.response?.data);
    toast.error("Error al actualizar el ítem.");
  } finally {
    setLoading(false);
  }
};


  if (!item) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 text-muted">Cargando datos del ítem...</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
  <ItemEditForm
    item={item}
    tiposEquipo={tiposEquipo}
    tipoReservas={tipoReservas}
    marcas={marcas}
    modelos={modelos}
    estados={estados}
    caracteristicas={caracteristicas}
    loading={loading}
    onSubmit={handleUpdate}
    isEditing={true}
  />
</div>
  );
}

async function detectTipoItem(id: number): Promise<"equipo" | "insumo"> {
  try {
    const item = await getItemById(id, "equipo");
    if ("numero_serie" in item) return "equipo";
    return "insumo";
  } catch {
    return "insumo";
  }
}