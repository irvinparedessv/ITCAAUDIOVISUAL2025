import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteItem, getItems } from "../../services/itemService";
import { getTipoEquipos } from "../../services/tipoEquipoService";
import type { Item, ItemTipo } from "app/types/item";
import type { TipoEquipo } from "app/types/tipoEquipo";
import ItemList from "~/components/equipment/ItemList";
import EquipoNoEncontrado from "~/components/error/EquipoNoEncontrado";

export default function ItemListPage() {
  const { modeloId } = useParams<{ modeloId: string }>(); 
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ItemTipo | 'todos'>('todos');
  const [modeloNoEncontrado, setModeloNoEncontrado] = useState(false);

  useEffect(() => {
    console.log("modeloId desde URL:", modeloId);
    if (!modeloId) {
      navigate('/inventario');
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      setModeloNoEncontrado(false);

      try {
        const [itemsData, tiposData] = await Promise.all([
          getItems({
            tipo: selectedType === 'todos' ? 'todos' : `${selectedType}s`,
            page: 1,
            perPage: 10,
            modeloId: Number(modeloId),
          }),
          getTipoEquipos(),
        ]);

        if (Array.isArray(itemsData.data) && itemsData.data.length === 0) {
          setModeloNoEncontrado(true);
        } else {
          setItems(itemsData.data || []);
        }
        
        setTipos(tiposData);
      } catch (error: any) {
        if (error.response?.status === 404) {
          setModeloNoEncontrado(true);
        } else {
          console.error("Error cargando datos:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [modeloId, selectedType, navigate]);

  if (modeloNoEncontrado) {
    return <EquipoNoEncontrado />;
  }

  const handleEdit = (item: Item) => {
    navigate(`/items/edit/${item.id}`, { state: { tipo: item.tipo } });
  };

  const handleDelete = async (id: number, tipo: ItemTipo) => {
    try {
      await deleteItem(id, tipo);
      // Recargar los datos después de eliminar
      setLoading(true);
      setModeloNoEncontrado(false);
      const itemsData = await getItems({
        tipo: selectedType === 'todos' ? 'todos' : `${selectedType}s`,
        page: 1,
        perPage: 10,
        modeloId: Number(modeloId),
      });
      setItems(itemsData.data || []);
    } catch (error) {
      console.error("Error eliminando item:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <ItemList
        tipos={tipos}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        modeloId={modeloId ? Number(modeloId) : undefined}
      />
    </div>
  );
}