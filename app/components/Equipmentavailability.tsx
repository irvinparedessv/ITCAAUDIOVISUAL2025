import { useState, useEffect } from "react";
import { Container, Table, Badge, Button, Row, Col, Form, Alert, Spinner } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from '~/api/axios';

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
    endTime: "17:00"
  });
  const [refreshing, setRefreshing] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Obtener la lista de equipos
  const fetchEquipment = async () => {
    try {
      const response = await api.get("/equipos");
      setEquipmentList(response.data);
    } catch (err) {
      setError("Error al cargar los equipos");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchEquipment();
  }, []);

  // Verificar disponibilidad para todos los equipos
  const checkAllAvailability = async () => {
    if (!availabilityData.fecha) {
      setError("Por favor seleccione una fecha");
      return;
    }

    setCheckingAvailability(true);
    try {
      const fechaStr = availabilityData.fecha.toISOString().split('T')[0];
      
      // Verificar disponibilidad para cada equipo
      const updatedEquipmentList = await Promise.all(
        equipmentList.map(async (equipo) => {
          try {
            const response = await api.get(`/equipos/${equipo.id}/disponibilidad`, {
              params: {
                fecha: fechaStr,
                startTime: availabilityData.startTime,
                endTime: availabilityData.endTime
              }
            });
            return {
              ...equipo,
              disponibilidad: response.data.disponibilidad
            };
          } catch (err) {
            console.error(`Error verificando disponibilidad para equipo ${equipo.id}:`, err);
            return {
              ...equipo,
              disponibilidad: undefined
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

  // Refrescar datos manualmente
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEquipment();
  };

  // Limpiar filtros y disponibilidad
  const handleClearFilters = () => {
    setAvailabilityData({
      fecha: null,
      startTime: "08:00",
      endTime: "17:00"
    });
    // Limpiar la disponibilidad mostrada
    setEquipmentList(prev => prev.map(equipo => ({
      ...equipo,
      disponibilidad: undefined
    })));
  };

  if (loading) return (
    <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <Spinner animation="border" variant="primary" />
    </Container>
  );

  if (error) return (
    <Container className="my-5">
      <Alert variant="danger" className="text-center">
        {error}
        <Button variant="link" onClick={handleRefresh}>Reintentar</Button>
      </Alert>
    </Container>
  );

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">Listado de Inventarios</h3>
            <div>
              <Button 
                variant="outline-primary" 
                onClick={handleRefresh}
                disabled={refreshing}
                className="me-2"
              >
                {refreshing ? (
                  <>
                    <Spinner as="span" size="sm" animation="border" />
                    <span className="ms-2">Actualizar</span>
                  </>
                ) : 'Actualizar'}
              </Button>
              <Button 
                variant="primary"
                onClick={checkAllAvailability}
                disabled={!availabilityData.fecha || checkingAvailability}
                className="me-2"
              >
                {checkingAvailability ? (
                  <>
                    <Spinner as="span" size="sm" animation="border" />
                    <span className="ms-2">Verificando...</span>
                  </>
                ) : 'Ver Disponibilidad'}
              </Button>
              <Button 
                variant="outline-secondary"
                onClick={handleClearFilters}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>

          {/* Filtros de disponibilidad */}
          <div className="mb-4 p-3 border rounded bg-light">
            <h5>Seleccione fecha y horario</h5>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Fecha</Form.Label>
                  <DatePicker
                    selected={availabilityData.fecha}
                    onChange={(date: Date | null) => setAvailabilityData({...availabilityData, fecha: date})}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    placeholderText="Seleccione una fecha"
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Hora de inicio</Form.Label>
                  <Form.Control
                    type="time"
                    value={availabilityData.startTime}
                    onChange={(e) => setAvailabilityData({...availabilityData, startTime: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Hora de fin</Form.Label>
                  <Form.Control
                    type="time"
                    value={availabilityData.endTime}
                    onChange={(e) => setAvailabilityData({...availabilityData, endTime: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            {availabilityData.fecha && (
              <div className="mt-2 text-muted">
                <small>
                  Mostrando disponibilidad para: {availabilityData.fecha.toLocaleDateString()} de {availabilityData.startTime} a {availabilityData.endTime}
                </small>
              </div>
            )}
          </div>

          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-primary">
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
                {equipmentList.map((equipment) => (
                  <tr key={equipment.id}>
                    <td>{equipment.nombre}</td>
                    <td>{equipment.cantidad}</td>
                    <td>
                      {equipment.disponibilidad ? (
                        <>
                          {equipment.disponibilidad.cantidad_disponible}
                          {equipment.disponibilidad.cantidad_disponible === equipment.cantidad}
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
                          (equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) === 0
                            ? "danger"
                            : (equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) < equipment.cantidad
                            ? "warning"
                            : "success"
                        }
                      >
                        {(equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) === 0
                          ? "Agotado"
                          : (equipment.disponibilidad?.cantidad_disponible ?? equipment.cantidad) < equipment.cantidad
                          ? "Limitado"
                          : "Disponible"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Col>
      </Row>
    </Container>
  );
}