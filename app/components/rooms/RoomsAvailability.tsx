import { useState, useEffect } from "react";
import { Badge, Button, Form, Alert, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../api/axios";
import { FaEye, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";
import { formatTo12h, timeOptions } from "~/utils/time";

interface Rango {
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  days: string[] | string;
}

interface Resultado {
  rango: Rango;
  reservas: any[];
  bloques_totales: number;
  cupos_ocupados: number;
  cupos_libres: number;
}

interface Aula {
  id: number;
  nombre: string;
  disponibilidad?: Resultado; // tomamos solo el primero por simplicidad
}

export default function RoomsAvailabilityList() {
  const [roomsList, setRoomsList] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    buscar: "",
    page: 1,
  });
  const [searchTerm, setSearchTerm] = useState(filters.buscar);

  const [availabilityData, setAvailabilityData] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  }>({
    startDate: null,
    endDate: null,
    startTime: "08:00",
    endTime: "17:00",
  });

  const handleBack = () => {
    navigate("/");
  };

  const fetchRooms = async () => {
    setLoading(false);
    try {
      const response = await api.get("/getaulas", {
        params: {
          buscar: filters.buscar || undefined,
          page: filters.page,
        },
      });
      setRoomsList(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (err) {
      setError("Error al cargar aulas");
      console.error(err);
    } finally {
      setLoading(true);
    }
  };

  const checkAllAvailability = async () => {
    if (!availabilityData.startDate || !availabilityData.endDate) {
      setError("Seleccione rango de fechas");
      return;
    }

    setCheckingAvailability(true);
    try {
      const start = availabilityData.startDate.toISOString().split("T")[0];
      const end = availabilityData.endDate.toISOString().split("T")[0];

      const updatedList = await Promise.all(
        roomsList.map(async (room) => {
          try {
            const res = await api.get(`/aulas/${room.id}/disponibilidad`, {
              params: {
                startDate: start,
                endDate: end,
                startTime: availabilityData.startTime,
                endTime: availabilityData.endTime,
              },
            });

            // Tomamos SOLO el primer rango por ahora
            const resultado: Resultado = res.data.resultados[0];

            return {
              ...room,
              disponibilidad: resultado,
            };
          } catch (err) {
            console.error(
              `Error verificando disponibilidad aula ${room.id}`,
              err
            );
            return { ...room, disponibilidad: undefined };
          }
        })
      );
      setRoomsList(updatedList);
    } catch (err) {
      setError("Error al verificar disponibilidad");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleClearFilters = () => {
    setAvailabilityData({
      startDate: null,
      endDate: null,
      startTime: "08:00",
      endTime: "17:00",
    });
    setFilters({ buscar: "", page: 1 });
    setRoomsList((prev) =>
      prev.map((r) => ({ ...r, disponibilidad: undefined }))
    );
  };

  useEffect(() => {
    fetchRooms();
  }, [filters]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setFilters((prev) => ({ ...prev, buscar: searchTerm, page: 1 }));
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{ cursor: "pointer", fontSize: "2rem" }}
          />
          <h2 className="fw-bold m-0">Disponibilidad de Espacios</h2>
        </div>
        <div className="d-flex flex-column flex-sm-row gap-2 mt-3 mt-sm-0 ms-auto">
          <Button
            variant="primary"
            onClick={checkAllAvailability}
            disabled={
              !availabilityData.startDate ||
              !availabilityData.endDate ||
              checkingAvailability
            }
          >
            {checkingAvailability ? (
              <>
                <Spinner as="span" size="sm" animation="border" />{" "}
                <span className="ms-2">Verificando...</span>
              </>
            ) : (
              <>
                <FaEye className="me-1" /> Ver disponibilidad
              </>
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
            <Form.Label>Buscar aula</Form.Label>
            <Form.Control
              type="text"
              placeholder="Nombre del aula"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>
        </div>
      </Form>

      <div className="mb-4 p-3 border rounded">
        <h5>Seleccione rango de fechas y horario</h5>
        <div className="row">
          <div className="col-md-3">
            <Form.Group>
              <Form.Label>Fecha inicio</Form.Label>
              <DatePicker
                selected={availabilityData.startDate}
                onChange={(date) =>
                  setAvailabilityData({ ...availabilityData, startDate: date })
                }
                className="form-control"
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                placeholderText="Fecha inicio"
                isClearable
              />
            </Form.Group>
          </div>
          <div className="col-md-3">
            <Form.Group>
              <Form.Label>Fecha fin</Form.Label>
              <DatePicker
                selected={availabilityData.endDate}
                onChange={(date) =>
                  setAvailabilityData({ ...availabilityData, endDate: date })
                }
                className="form-control"
                dateFormat="dd/MM/yyyy"
                minDate={availabilityData.startDate || new Date()}
                placeholderText="Fecha fin"
                isClearable
              />
            </Form.Group>
          </div>
          <div className="col-md-3">
            <Form.Group>
              <Form.Label>Hora inicio</Form.Label>
              <Form.Select
                value={availabilityData.startTime}
                onChange={(e) =>
                  setAvailabilityData({
                    ...availabilityData,
                    startTime: e.target.value,
                  })
                }
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTo12h(time)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <div className="col-md-3">
            <Form.Group>
              <Form.Label>Hora fin</Form.Label>
              <Form.Select
                value={availabilityData.endTime}
                onChange={(e) =>
                  setAvailabilityData({
                    ...availabilityData,
                    endTime: e.target.value,
                  })
                }
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTo12h(time)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        </div>
      </div>

      {!loading && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando aulas...</p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
      {loading && (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>Nombre</th>
                  <th>Bloques Totales</th>
                  <th>Cupos Ocupados</th>
                  <th>Cupos Libres</th>
                </tr>
              </thead>
              <tbody>
                {roomsList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-muted py-4">
                      No se encontraron aulas.
                    </td>
                  </tr>
                ) : (
                  roomsList.map((room) => (
                    <tr key={room.id}>
                      <td>{room.nombre}</td>
                      <td>{room.disponibilidad?.bloques_totales ?? "-"}</td>
                      <td>{room.disponibilidad?.cupos_ocupados ?? "-"}</td>
                      <td>{room.disponibilidad?.cupos_libres ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationComponent
            page={filters.page}
            totalPages={totalPages}
            onPageChange={(page) => setFilters({ ...filters, page })}
          />
        </>
      )}
    </div>
  );
}
