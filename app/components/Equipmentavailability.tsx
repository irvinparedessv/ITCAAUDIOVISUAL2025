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

type Equipment = {
  id: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  tipo_equipo: {
    nombre: string;
  };
  disponibilidad?: {
    cantidad_total: number;
    cantidad_disponible: number;
    cantidad_en_reserva: number;
    cantidad_entregada: number;
  };
};

type AvailabilityData = {
  fecha: Date | null;
  startTime: string;
  endTime: string;
};

export default function EquipmentAvailabilityList() {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData>({
    fecha: null,
    startTime: "08:00",
    endTime: "17:00",
  });
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const fetchEquipment = async () => {
    try {
      const response = await api.get("/equipos");
      console.log("equipos:", response.data);
      // Accede a response.data.data donde está el array real
      setEquipmentList(response.data.data || []); // Usamos || [] como fallback por si es undefined
    } catch (err) {
      setError("Error al cargar los equipos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const checkAllAvailability = async () => {
    if (!availabilityData.fecha) {
      setError("Por favor seleccione una fecha");
      return;
    }

    setCheckingAvailability(true);
    try {
      const fechaStr = availabilityData.fecha.toISOString().split("T")[0];

      const updatedEquipmentList = await Promise.all(
        equipmentList.map(async (equipo) => {
          try {
            const response = await api.get(
              `/equipos/${equipo.id}/disponibilidad`,
              {
                params: {
                  fecha: fechaStr,
                  startTime: availabilityData.startTime,
                  endTime: availabilityData.endTime,
                },
              }
            );
            return {
              ...equipo,
              disponibilidad: response.data.disponibilidad,
            };
          } catch (err) {
            console.error(
              `Error verificando disponibilidad para equipo ${equipo.id}:`,
              err
            );
            return {
              ...equipo,
              disponibilidad: undefined,
            };
          }
        })
      );

      setEquipmentList(updatedEquipmentList);
    } catch (err) {
      setError("Error al verificar disponibilidad");
      console.error(err);
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
    setEquipmentList((prev) =>
      prev.map((equipo) => ({
        ...equipo,
        disponibilidad: undefined,
      }))
    );
  };

  if (loading)
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <Spinner animation="border" variant="primary" />
      </Container>
    );

  if (error)
    return (
      <Container className="my-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );

  return (
    <div className="container py-5">
      <div className="table-responsive rounded shadow p-3 mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0 text-center">Listado de Equipos Disponibles</h4>
          <div>
            <Button
              variant="primary"
              className="me-2 btn-custom-red"
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
                <Form.Control
                  type="time"
                  value={availabilityData.startTime}
                  onChange={(e) =>
                    setAvailabilityData({
                      ...availabilityData,
                      startTime: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Hora de fin</Form.Label>
                <Form.Control
                  type="time"
                  value={availabilityData.endTime}
                  onChange={(e) =>
                    setAvailabilityData({
                      ...availabilityData,
                      endTime: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </div>
          </div>
          {availabilityData.fecha && (
            <div className="mt-2 text-muted">
              <small>
                Mostrando disponibilidad para:{" "}
                {availabilityData.fecha.toLocaleDateString()} de{" "}
                {availabilityData.startTime} a {availabilityData.endTime}
              </small>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <table
          className="table table-hover align-middle text-center overflow-hidden"
          style={{ borderRadius: "0.8rem" }}
        >
          <thead className="table-dark">
            <tr>
              <th className="rounded-top-start">Nombre</th>
              <th>Total</th>
              <th>Disponible</th>
              <th>En Reserva</th>
              <th>Entregado</th>
              <th className="rounded-top-end">Estado</th>
            </tr>
          </thead>
          <tbody>
            {equipmentList.map((equipment) => (
              <tr key={equipment.id}>
                <td className="fw-bold">{equipment.nombre}</td>
                <td>{equipment.cantidad}</td>
                <td>
                  {equipment.disponibilidad ? (
                    <>
                      {equipment.disponibilidad.cantidad_disponible}
                      {equipment.disponibilidad.cantidad_disponible ===
                        equipment.cantidad}
                    </>
                  ) : (
                    equipment.cantidad
                  )}
                </td>
                <td>{equipment.disponibilidad?.cantidad_en_reserva ?? 0}</td>
                <td>{equipment.disponibilidad?.cantidad_entregada ?? 0}</td>
                <td>
                  <Badge
                    bg={
                      (equipment.disponibilidad?.cantidad_disponible ??
                        equipment.cantidad) === 0
                        ? "danger"
                        : (equipment.disponibilidad?.cantidad_disponible ??
                            equipment.cantidad) < equipment.cantidad
                        ? "warning"
                        : "success"
                    }
                    className="px-3 py-2"
                    style={{ fontSize: "0.9rem" }}
                  >
                    {(equipment.disponibilidad?.cantidad_disponible ??
                      equipment.cantidad) === 0
                      ? "Agotado"
                      : (equipment.disponibilidad?.cantidad_disponible ??
                          equipment.cantidad) < equipment.cantidad
                      ? "Limitado"
                      : "Disponible"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
