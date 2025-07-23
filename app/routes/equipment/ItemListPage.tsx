import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteItem, getItems } from "../../services/itemService";
import { getTipoEquipos } from "../../services/tipoEquipoService";
import type { Item, ItemTipo } from "app/types/item";
import type { TipoEquipo } from "app/types/tipoEquipo";
import ItemList from "~/components/equipment/ItemList";

export default function ItemListPage() {
  const { modeloId } = useParams<{ modeloId?: string }>();
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ItemTipo | 'todos'>('todos');

  // Si no hay modeloId, redirige o muestra mensaje (evitar llamadas sin modeloId)
  useEffect(() => {
    console.log("modeloId desde URL:", modeloId);
    if (!modeloId) {
      // Puedes redirigir o mostrar una página 404

      navigate('/inventario');
      return;
    }
    fetchData();
  }, [modeloId, selectedType]);

  const fetchData = async () => {
    if (!modeloId) return; // seguridad adicional

    setLoading(true);

    try {
      const [itemsData, tiposData] = await Promise.all([
        getItems({
          tipo: selectedType === 'todos' ? 'todos' : `${selectedType}s`,
          page: 1,
          perPage: 10,
          modeloId: Number(modeloId), // modeloId siempre definido aquí
        }),
        getTipoEquipos(),
      ]);

      setItems(Array.isArray(itemsData.data) ? itemsData.data : []);
      setTipos(tiposData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    navigate(`/items/edit/${item.id}`, { state: { tipo: item.tipo } });
  };

  const handleDelete = async (id: number, tipo: ItemTipo) => {
    try {
      await deleteItem(id, tipo);
      fetchData();
    } catch (error) {
      console.error("Error eliminando item:", error);
    }
  };
  console.log("Pasando modeloId al hijo:", modeloId ? Number(modeloId) : undefined);
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
