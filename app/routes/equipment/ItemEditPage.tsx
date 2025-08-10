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
import EquipoNoEncontrado from "~/components/error/EquipoNoEncontrado";

export default function ItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false); // Nuevo estado
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
        setNotFound(false); // Resetear estado antes de buscar
        const tipo = await detectTipoItem(Number(id));
        const fetchedItem = await getItemById(Number(id), tipo);
        
        if (!fetchedItem) {
          setNotFound(true);
          return;
        }
        
        setItem(fetchedItem);

        if (tipo === "equipo") {
          const valores = await getValoresCaracteristicasPorEquipo(Number(id));
          setCaracteristicas(valores);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error("No se pudo cargar el ítem.");
          console.error("Error loading item:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (notFound) {
    return <EquipoNoEncontrado />;
  }

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

  const handleUpdate = async (formData: FormData) => {
    try {
      setLoading(true);
      const tipo: "equipo" | "insumo" = item?.tipo || "equipo";
      
      // 1. Actualizar datos básicos del item
      const response = await updateItem(Number(id), formData, tipo);

      // 2. Actualizar características si es equipo y vienen en formData
      if (tipo === "equipo" && formData.get('caracteristicas')) {
        await actualizarValoresCaracteristicasPorEquipo(Number(id), JSON.parse(formData.get('caracteristicas') as string));
      }

      // 3. Retornar la respuesta para que ItemForm maneje el feedback al usuario
      return response;

    } catch (error: any) {
      console.error('Error en la actualización:', error.response?.data);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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