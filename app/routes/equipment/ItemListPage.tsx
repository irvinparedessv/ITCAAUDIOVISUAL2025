import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteItem, getItems } from "../../services/itemService";
import { getTipoEquipos } from "../../services/tipoEquipoService";
import type { Item, ItemTipo, PaginatedItems } from "app/types/item";
import type { TipoEquipo } from "app/types/tipoEquipo";
import ItemList from "~/components/equipment/ItemList";

export default function ItemListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ItemTipo | 'todos'>('todos');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [itemsData, tiposData] = await Promise.all([
        getItems({ 
          tipo: selectedType === 'todos' ? 'todos' : `${selectedType}s`,
          page: 1, 
          perPage: 10 
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

  useEffect(() => {
    fetchData();
  }, [selectedType]);

  const handleEdit = (item: Item) => {
    navigate(`/items/editar/${item.id}`, { state: { tipo: item.tipo } });
  };

  const handleDelete = async (id: number, tipo: ItemTipo) => {
    try {
      await deleteItem(id, tipo);
      fetchData(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error("Error eliminando item:", error);
    }
  };

  return (
    <div className="container mt-4">
      <ItemList
        tipos={tipos}
        loading={loading}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}