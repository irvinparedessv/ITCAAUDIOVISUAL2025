import { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Container,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../api/axios";
import type { AvailabilityData, Equipment, TipoEquipo } from "../types/equipo";
import { formatTo12h, timeOptions } from "~/utils/time";

export default function EquipmentAvailabilityList() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [tipoEquipos, setTipoEquipos] = useState<TipoEquipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    fecha: null,
    startTime: "08:00",
    endTime: "17:00",
  });

  const [filtros, setFiltros] = useState({
    tipo_equipo_id: "",
    buscar: "",
    page: 1,
  });
  const [searchTerm, setSearchTerm] = useState(filtros.buscar);

  const fetchTipoEquipos = async () => {
    try {
      const response = await api.get("/tipoEquipos");
      setTipoEquipos(response.data);
    } catch (error) {
      console.error("Error al cargar tipos de equipo", error);
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await api.get("/obtenerEquipos", {
        params: {
          tipo_equipo_id: filtros.tipo_equipo_id || undefined,
          buscar: filtros.buscar || undefined,
          page: filtros.page,
        },
      });
      setEquipmentList(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (err) {
      setError("Error al cargar los equipos");
      console.error(err);
    } 
  };

  const checkAllAvailability = async () => {
    if (!availabilityData.fecha) {
      setError("Por favor seleccione una fecha");
      return;
    }

    setCheckingAvailability(true);
    try {
      const fechaStr = availabilityData.fecha.toISOString().split("T")[0];
      const updatedList = await Promise.all(
        equipmentList.map(async (equipo) => {
          try {
            const res = await api.get(`/equipos/${equipo.id}/disponibilidad`, {
              params: {
                fecha: fechaStr,
                startTime: availabilityData.startTime,
                endTime: availabilityData.endTime,
              },
            });
            return {
              ...equipo,
              disponibilidad: res.data.disponibilidad,
            };
          } catch (err) {
            console.error(`Error verificando disponibilidad para equipo ${equipo.id}:`, err);
            return { ...equipo, disponibilidad: undefined };
          }
        })
      );
      setEquipmentList(updatedList);
    } catch (err) {
      setError("Error al verificar disponibilidad");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleClearFilters = () => {
    setAvailabilityData({
      fecha: null,
      startTime: "08:00",
      endTime: "17:00",
    });
    setFiltros({
      tipo_equipo_id: "",
      buscar: "",
      page: 1,
    });
    setEquipmentList((prev) =>
      prev.map((e) => ({ ...e, disponibilidad: undefined }))
    );
  };

  useEffect(() => {
    fetchTipoEquipos();
  }, []);

  useEffect(() => {
    fetchEquipment();
  }, [filtros]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFiltros((prev) => ({ ...prev, buscar: searchTerm, page: 1 }));
    }, 500); // espera 500ms

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);


  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">Listado de Equipos Disponibles</h4>
          <div>
            <Button
              variant="primary"
              className="me-2"
              onClick={checkAllAvailability}
              disabled={!availabilityData.fecha || checkingAvailability}
            >
              {checkingAvailability ? (
                <>
                  <Spinner as="span" size="sm" animation="border" />
                  <span className="ms-2">Verificando...</span>
                </>
              ) : (
                "Ver Disponibilidad"
              )}
            </Button>
            <Button variant="outline-secondary" onClick={handleClearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </div>

        <Form className="row g-3 mb-4" onSubmit={(e) => e.preventDefault()}>
          <div className="col-md-4">
            <Form.Group>
              <Form.Label>Tipo de equipo</Form.Label>
              <Form.Select
                value={filtros.tipo_equipo_id}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipo_equipo_id: e.target.value, page: 1 })
                }
              >
                <option value="">Todos</option>
                {tipoEquipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div className="col-md-4">
            <Form.Group>
              <Form.Label>Buscar equipo</Form.Label>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            </Form.Group>
          </div>
        </Form>

        <div className="mb-4 p-3 border rounded">
          <h5>Seleccione fecha y horario</h5>
          <div className="row">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Fecha</Form.Label>
                <DatePicker
                  selected={availabilityData.fecha}
                  onChange={(date: Date | null) =>
                    setAvailabilityData({ ...availabilityData, fecha: date })
                  }
                  className="form-control"
                  dateFormat="yyyy-MM-dd"
                  minDate={new Date()}
                  placeholderText="Seleccione una fecha"
                  isClearable
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Hora de inicio</Form.Label>
                <Form.Select
                  value={availabilityData.startTime}
                  onChange={(e) =>
                    setAvailabilityData({
                      ...availabilityData,
                      startTime: e.target.value,
                    })
                  }
                >
                  <option value="">Selecciona una hora</option>
                  {timeOptions
                    .filter((time) => {
                      const [hourStr, minStr] = time.split(":");
                      const hour = Number(hourStr);
                      const minutes = Number(minStr);
                      // Permitir solo hasta 17:00 (sin 17:30)
                      return hour < 17 || (hour === 17 && minutes === 0);
                    })
                    .map((time) => (
                      <option key={time} value={time}>
                        {formatTo12h(time)}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Hora de fin</Form.Label>
                <Form.Select
                  value={availabilityData.endTime}
                  onChange={(e) =>
                    setAvailabilityData({
                      ...availabilityData,
                      endTime: e.target.value,
                    })
                  }
                >
                  <option value="">Selecciona una hora</option>
                  {timeOptions
                    .filter((time) => {
                      const [hourStr, minStr] = time.split(":");
                      const hour = Number(hourStr);
                      const minutes = Number(minStr);
                      if (availabilityData.startTime) {
                        const [startHourStr, startMinStr] = availabilityData.startTime.split(":");
                        const startHour = Number(startHourStr);
                        const startMinutes = Number(startMinStr);
                        const timeMinutes = hour * 60 + minutes;
                        const startMinutesTotal = startHour * 60 + startMinutes;
                        // Solo mostrar horas mayores a la hora de inicio seleccionada
                        if (timeMinutes <= startMinutesTotal) return false;
                      }
                      // Limitar la hora máxima a 20:00 (sin 20:30)
                      return hour < 20 || (hour === 20 && minutes === 0);
                    })
                    .map((time) => (
                      <option key={time} value={time}>
                        {formatTo12h(time)}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
          {availabilityData.fecha && (
            <div className="mt-2 text-muted">
              <small>
                Mostrando disponibilidad para:{" "}
                {availabilityData.fecha.toLocaleDateString()} de{" "}
                {formatTo12h(availabilityData.startTime)} a {formatTo12h(availabilityData.endTime)}
              </small>
            </div>
          )}
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <table className="table table-hover align-middle text-center">      
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Total</th>
              <th>Disponible</th>
              <th>En Reserva</th>
              <th>Entregado</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-4">
                  No se encontraron equipos.
                </td>
              </tr>
            ) : (
              equipmentList.map((equipment) => (
                <tr key={equipment.id}>
                  <td className="fw-bold">{equipment.nombre}</td>
                  <td>{equipment.cantidad}</td>
                  <td>
                    {equipment.disponibilidad
                      ? equipment.disponibilidad.cantidad_disponible
                      : equipment.cantidad}
                  </td>
                  <td>{equipment.disponibilidad?.cantidad_en_reserva ?? 0}</td>
                  <td>{equipment.disponibilidad?.cantidad_entregada ?? 0}</td>
                  <td>
                    <Badge
                      bg={
                        (equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) === 0
                          ? "danger"
                          : (equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) <
                            equipment.cantidad
                          ? "warning"
                          : "success"
                      }
                      className="px-3 py-2"
                    >
                      {(equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) === 0
                        ? "Agotado"
                        : (equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) <
                          equipment.cantidad
                        ? "Limitado"
                        : "Disponible"}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <ul className="pagination">
              <li className={`page-item ${filtros.page === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() =>
                    setFiltros((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  Anterior
                </button>
              </li>
              {[...Array(totalPages)].map((_, i) => (
                <li
                  key={i}
                  className={`page-item ${filtros.page === i + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => setFiltros({ ...filtros, page: i + 1 })}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${filtros.page === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() =>
                    setFiltros((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))
                  }
                >
                  Siguiente
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
