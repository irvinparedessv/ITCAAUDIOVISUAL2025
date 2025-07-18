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

  const handleSubmit = async (data: any, tipo: 'equipo' | 'insumo') => {
    try {
      await createItem(data, tipo);
      toast.success(`${tipo === 'equipo' ? 'Equipo' : 'Insumo'} creado exitosamente`);
      navigate('/items');
    } catch (error: any) {
      console.error("Error creando ítem:", error);
      const errorMsg = error.response?.data?.message || 
        `Error al crear ${tipo === 'equipo' ? 'equipo' : 'insumo'}`;
      toast.error(errorMsg);
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