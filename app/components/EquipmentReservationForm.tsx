import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import Select from "react-select";
import type { MultiValue, SingleValue } from "react-select";
import { useAuth } from "../hooks/AuthContext";
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Spinner,
} from "react-bootstrap";
import {
  FaCalendarAlt,
  FaClock,
  FaBoxOpen,
  FaBoxes,
  FaSchool,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify"; // ⭐ CAMBIO
import "react-toastify/dist/ReactToastify.css"; // ⭐ CAMBIO
import api from "../api/axios";

export default function EquipmentReservationForm() {
  type OptionType = { value: string; label: string };

  const [formData, setFormData] = useState<{
    equipment: MultiValue<OptionType>;
    aula: SingleValue<OptionType>;
    date: string;
    startTime: string;
    endTime: string;
  }>({
    equipment: [],
    aula: null,
    date: "",
    startTime: "",
    endTime: "",
  });

  const [equipmentOptions, setEquipmentOptions] = useState<OptionType[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState<boolean>(true);
  const [errorEquipments, setErrorEquipments] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState<boolean>(false); // ⭐ CAMBIO
  const { user } = useAuth();

  const aulaOptions = [
    { value: "Aula 101", label: "Aula 101" },
    { value: "Aula 202", label: "Aula 202" },
    { value: "Auditorio", label: "Auditorio" },
    { value: "Sala de grabación", label: "Sala de grabación" },
  ];

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await api.get("/Obtenerequipos");
        const data = response.data;
        const options = data.map((item: any) => ({
          value: item.id,
          label: item.nombre,
        }));

        setEquipmentOptions(options);
      } catch (error) {
        setErrorEquipments("Error cargando los equipos. Intente nuevamente.");
      } finally {
        setLoadingEquipments(false);
      }
    };

    fetchEquipments();
  }, []);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("No se ha encontrado el usuario. Por favor inicie sesión.");
      return;
    }

    const payload = {
      user_id: user.id,
      equipo: formData.equipment.map((eq) => eq.value),
      aula: formData.aula?.value || "",
      fecha_reserva: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    try {
      setLoadingSubmit(true); // ⭐ CAMBIO

      await api.post("/reservas", payload);

      toast.success("¡Reserva guardada exitosamente!"); // ⭐ CAMBIO

      // Limpiar formulario
      setFormData({
        equipment: [],
        aula: null,
        date: "",
        startTime: "",
        endTime: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la reserva. Intenta nuevamente."); // ⭐ CAMBIO
    } finally {
      setLoadingSubmit(false); // ⭐ CAMBIO
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <ToastContainer /> {/* ⭐ CAMBIO */}
      <Row className="w-100 justify-content-center">
        <Col md={6} lg={5}>
          <Card className="shadow-lg">
            <Card.Header className="bg-primary text-white text-center">
              <h4 className="mb-0">Reservación de Equipos</h4>
            </Card.Header>

            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Multiselect Equipos */}
                <Form.Group className="mb-3" controlId="formEquipment">
                  <Form.Label className="d-flex align-items-center">
                    <FaBoxes className="me-2" />
                    Equipos
                  </Form.Label>
                  {loadingEquipments ? (
                    <div className="d-flex justify-content-center">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : errorEquipments ? (
                    <div className="text-danger text-center">
                      {errorEquipments}
                    </div>
                  ) : (
                    <Select
                      isMulti
                      options={equipmentOptions}
                      value={formData.equipment}
                      onChange={(selected) =>
                        setFormData((prev) => ({
                          ...prev,
                          equipment: selected,
                        }))
                      }
                      placeholder="Selecciona equipos"
                    />
                  )}
                </Form.Group>

                {/* Select Aula */}
                <Form.Group className="mb-3" controlId="formAula">
                  <Form.Label className="d-flex align-items-center">
                    <FaSchool className="me-2" />
                    Aula
                  </Form.Label>
                  <Select
                    options={aulaOptions}
                    value={formData.aula}
                    onChange={(selected) =>
                      setFormData((prev) => ({
                        ...prev,
                        aula: selected,
                      }))
                    }
                    placeholder="Selecciona aula"
                  />
                </Form.Group>

                {/* Fecha */}
                <Form.Group className="mb-3" controlId="formDate">
                  <Form.Label className="d-flex align-items-center">
                    <FaCalendarAlt className="me-2" />
                    Fecha de Reserva
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                {/* Horas */}
                <Row>
                  <Col sm={6}>
                    <Form.Group className="mb-3" controlId="formStartTime">
                      <Form.Label className="d-flex align-items-center">
                        <FaClock className="me-2" />
                        Hora de inicio
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-3" controlId="formEndTime">
                      <Form.Label className="d-flex align-items-center">
                        <FaClock className="me-2" />
                        Hora de entrega
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid">
                  <Button
                    className="d-flex align-items-center justify-content-center"
                    variant="primary"
                    type="submit"
                    disabled={loadingSubmit} // ⭐ CAMBIO
                  >
                    {loadingSubmit ? ( // ⭐ CAMBIO
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FaBoxOpen className="me-2" />
                        Reservar Equipos
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
