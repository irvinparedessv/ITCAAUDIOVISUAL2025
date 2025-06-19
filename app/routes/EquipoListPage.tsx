import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteEquipo, getEquipos } from "../services/equipoService";
import { getTipoEquipos } from "../services/tipoEquipoService";
import type { Equipo } from "app/types/equipo";
import type { TipoEquipo } from "app/types/tipoEquipo";
import EquipoList from "../components/equipo/EquipoList";
import { Button } from "react-bootstrap";

export default function EquipoListPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [tipos, setTipos] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [equiposData, tiposData] = await Promise.all([
        getEquipos({ search: "", page: 1, perPage: 5 }),
        getTipoEquipos(),
      ]);
      
      setEquipos(Array.isArray(equiposData.data) ? equiposData.data : []);
      setTipos(tiposData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (equipo: Equipo) => {
    navigate(`/equipos/editar/${equipo.id}`);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEquipo(id);
      fetchData(); // Recargar la lista después de eliminar
    } catch (error) {
      console.error("Error eliminando equipo:", error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Listado de Equipos</h2>
        <Button 
          variant="primary" 
          onClick={() => navigate('/equipo')}
        >
          Crear Nuevo Equipo
        </Button>
      </div>

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <EquipoList 
          tipos={tipos}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}