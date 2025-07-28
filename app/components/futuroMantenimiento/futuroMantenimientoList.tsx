// components/futuroMantenimiento/FuturoMantenimientoList.tsx
import React, { useEffect, useState } from "react";
import { getFuturosMantenimiento } from "../../services/futuroMantenimientoService";
import type { FuturoMantenimiento } from "../../types/futuroMantenimiento";
import { Button, Table } from "react-bootstrap";
import { toast } from "react-toastify";

const futuroMantenimientoList = () => {
  const [futuros, setFuturos] = useState<FuturoMantenimiento[]>([]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await getFuturosMantenimiento();
      console.log("Respuesta de futuros mantenimientos:", response);
      // resto del código

        // Comprobamos si es paginado (Laravel paginate)
        if (response && response.data && Array.isArray(response.data)) {
          setFuturos(response.data);
        } else if (response && Array.isArray(response.data)) {
          setFuturos(response.data);
        } else {
          toast.error("No se encontraron futuros mantenimientos");
          setFuturos([]);
        }
      } catch (error) {
        console.error("Error al cargar mantenimientos futuros:", error);
        toast.error("Error al cargar mantenimientos futuros");
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2 className="mb-4">Listado de Mantenimientos Futuros</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Fecha</th>
            <th>Hora Inicio</th>
            <th>Hora Fin</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
         {futuros.length > 0 ? (
  futuros.map((item) => (
    <tr key={item.id}>
      <td>{item.equipo?.nombre || "Sin equipo"}</td>
      <td>{item.fecha_mantenimiento || "-"}</td>
      <td>{item.hora_mantenimiento_inicio || "-"}</td>
      <td>{item.hora_mantenimiento_final || "-"}</td>
      <td>{item.tipo_mantenimiento?.nombre || "Sin tipo"}</td>
      <td>
        {/* Aquí tus botones o acciones */}
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan={6}>No hay mantenimientos futuros.</td>
  </tr>
)}

        </tbody>
      </Table>
    </div>
  );
};

export default futuroMantenimientoList;
