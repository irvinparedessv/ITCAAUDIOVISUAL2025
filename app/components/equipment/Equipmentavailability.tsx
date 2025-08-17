import { useState, useEffect } from "react";
import { Badge, Button, Form, Alert, Spinner, Modal } from "react-bootstrap";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../api/axios";
import { formatTo12h, timeOptions } from "~/utils/time";
import { FaEye, FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import PaginationComponent from "~/utils/Pagination";
import { APIURL } from "~/constants/constant";

export default function EquipmentAvailabilityList() {
  interface Equipo {
    equipo_id: number;
    modelo_id: number;
    numero_serie: string;
    tipo_equipo: string;
    imagen_glb: string | null;
    imagen_normal: string | null;
    estado: string;
    // nuevos flags por equipo (si el backend los devuelve en este listado)
    en_reposo?: boolean;
    futuro_mantenimiento?: boolean;
  }

  interface Modelo {
    modelo_id: number;
    nombre_modelo: string;
    nombre_marca: string;
    imagen_normal: string | null;
    imagen_glb: string | null;
    disponibles: number;
    reservados: number;
    // nuevos campos
    en_reposo: number;
    mantenimiento: number; // total (actual + programado) — sigue existiendo
    mantenimiento_actual?: number;
    futuro_mantenimiento?: number;
    equipos: Equipo[];
  }

  const [equipmentList, setEquipmentList] = useState<Modelo[]>([]);
  const [tipoEquipos, setTipoEquipos] = useState<
    { id: number; nombre: string }[]
  >([]);
  const [modelosDisponibles, setModelosDisponibles] = useState<
    { label: string; value: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<{
    imageUrl: string;
    name: string;
    isGLB?: boolean;
  } | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const navigate = useNavigate();

  const [filtros, setFiltros] = useState({
    tipo_equipo_id: "",
    modelo_id: [] as number[],
    page: 1,
    fecha: "",
    startTime: "",
    endTime: "",
  });

  const handleBack = () => {
    navigate("/");
  };

  const handleImageClick = (
    glb: string | null,
    normal: string | null,
    name: string
  ) => {
    console.log(APIURL + glb);
    console.log(APIURL + normal);
    if (glb) {
      setSelectedEquipment({ imageUrl: APIURL + "/" + glb, name, isGLB: true });
    } else if (normal) {
      setSelectedEquipment({
        imageUrl: APIURL + "/" + normal,
        name,
        isGLB: false,
      });
    }
    setShowImageModal(true);
  };

  const fetchTipoEquipos = async () => {
    try {
      const response = await api.get("/tipoEquipos");
      setTipoEquipos(response.data);
    } catch (error) {
      console.error("Error al cargar tipos de equipo", error);
    }
  };

  const fetchModelos = async () => {
    try {
      const response = await api.get("/modelosEquiposDisponibles");
      const options = response.data.map(
        (modelo: { nombre_modelo: string; modelo_id: number }) => ({
          value: modelo.modelo_id,
          label: modelo.nombre_modelo,
        })
      );
      setModelosDisponibles(options);
    } catch (error) {
      console.error("Error al obtener modelos", error);
    }
  };

  const fetchEquipment = async () => {
    if (!filtros.fecha || !filtros.startTime || !filtros.endTime) {
      setError("Debe seleccionar fecha, hora de inicio y hora de fin.");
      return;
    }
    if (filtros.endTime <= filtros.startTime) {
      setError("La hora de fin debe ser mayor a la hora de inicio.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await api.get("/obtenerEquipos", {
        params: {
          tipo_equipo_id: filtros.tipo_equipo_id || undefined,
          modelo_id:
            filtros.modelo_id.length > 0 ? filtros.modelo_id : undefined,
          page: filtros.page,
          fecha: filtros.fecha,
          startTime: filtros.startTime,
          endTime: filtros.endTime,
        },
      });
      setEquipmentList(response.data.data);
      setTotalPages(response.data.last_page);
      setBusquedaRealizada(true);
    } catch (err) {
      setError("Error al cargar los equipos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFiltros({
      tipo_equipo_id: "",
      modelo_id: [],
      page: 1,
      fecha: "",
      startTime: "",
      endTime: "",
    });
    setEquipmentList([]);
    setError(null);
    setBusquedaRealizada(false);
  };

  useEffect(() => {
    const loadFiltros = async () => {
      setLoadingFiltros(true);
      await Promise.all([fetchTipoEquipos(), fetchModelos()]);
      setLoadingFiltros(false);
    };
    loadFiltros();
  }, []);

  return (
    <div className="table-responsive rounded shadow p-3 mt-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <FaLongArrowAltLeft
            onClick={handleBack}
            title="Regresar"
            style={{ cursor: "pointer", fontSize: "2rem" }}
          />
          <h2 className="fw-bold m-0">Disponibilidad de equipos</h2>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-2 mt-3 mt-sm-0 ms-auto">
          {/* @ts-ignore */}
          <Button
            variant="primary"
            onClick={fetchEquipment}
            disabled={loading || loadingFiltros}
          >
            {loading ? "Buscando..." : "Buscar"}
          </Button>
          <Button
            variant="outline-secondary"
            onClick={handleClearFilters}
            style={{ transition: "transform 0.2s ease-in-out" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.03)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            disabled={loading}
          >
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {loadingFiltros ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando filtros...</p>
        </div>
      ) : (
        <Form className="row g-3 mb-4" onSubmit={(e) => e.preventDefault()}>
          <div className="col-md-3">
            <Form.Group>
              <Form.Label>Tipo de equipo</Form.Label>
              <Form.Select
                value={filtros.tipo_equipo_id}
                onChange={(e) =>
                  setFiltros({ ...filtros, tipo_equipo_id: e.target.value })
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

          <div className="col-md-3">
            <Form.Group>
              <Form.Label>Modelo de equipo</Form.Label>
              <div style={{ minHeight: "38px" }}>
                <Select
                  options={modelosDisponibles}
                  isMulti
                  value={modelosDisponibles.filter((m) =>
                    filtros.modelo_id.includes(m.value)
                  )}
                  onChange={(selectedOptions) =>
                    setFiltros({
                      ...filtros,
                      modelo_id: selectedOptions
                        ? selectedOptions.map((opt) => opt.value)
                        : [],
                    })
                  }
                  placeholder="Seleccione modelo(s)"
                  noOptionsMessage={() => "No hay más modelos disponibles"}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "38px",
                      borderColor: "#ced4da",
                      boxShadow: "none",
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                      fontWeight: 400,
                      padding: "0.4rem",
                      backgroundColor: "transparent !important",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "transparent",
                      border: "1px solid #ced4da",
                      borderRadius: "0.25rem",
                      padding: "0 2px",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#495057",
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#495057",
                      cursor: "pointer",
                      ":hover": {
                        backgroundColor: "#f8f9fa",
                        color: "#212529",
                      },
                    }),
                  }}
                />
              </div>
            </Form.Group>
          </div>

          <div className="col-md-2">
            <Form.Group>
              <Form.Label>Fecha</Form.Label>
              <DatePicker
                selected={
                  filtros.fecha
                    ? (() => {
                        const [year, month, day] = filtros.fecha
                          .split("-")
                          .map(Number);
                        const date = new Date();
                        date.setFullYear(year, month - 1, day);
                        date.setHours(0, 0, 0, 0);
                        return date;
                      })()
                    : null
                }
                onChange={(date: Date | null) => {
                  const formatted = date
                    ? `${date.getFullYear()}-${(date.getMonth() + 1)
                        .toString()
                        .padStart(2, "0")}-${date
                        .getDate()
                        .toString()
                        .padStart(2, "0")}`
                    : "";
                  setFiltros({
                    ...filtros,
                    fecha: formatted,
                  });
                }}
                className="form-control"
                dateFormat="dd-MM-yyyy"
                placeholderText="Seleccione una fecha"
                isClearable
              />
            </Form.Group>
          </div>

          <div className="col-md-2">
            <Form.Group>
              <Form.Label>Hora inicio</Form.Label>
              <Form.Select
                value={filtros.startTime}
                onChange={(e) =>
                  setFiltros({ ...filtros, startTime: e.target.value })
                }
              >
                <option value="">Selecciona</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTo12h(time)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>

          <div className="col-md-2">
            <Form.Group>
              <Form.Label>Hora fin</Form.Label>
              <Form.Select
                value={filtros.endTime}
                onChange={(e) =>
                  setFiltros({ ...filtros, endTime: e.target.value })
                }
              >
                <option value="">Selecciona</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {formatTo12h(time)}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        </Form>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando datos...</p>
        </div>
      ) : (
        busquedaRealizada && (
          <div className="table-responsive">
            <table className="table table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th>Imagen</th>
                  <th>Disponible</th>
                  <th>Reservado</th>
                  <th>Mant. actual</th>
                  <th>Futuro mant.</th>
                  <th>En reposo</th>
                </tr>
              </thead>
              <tbody>
                {equipmentList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No se encontraron equipos.
                    </td>
                  </tr>
                ) : (
                  equipmentList.map((modelo) => (
                    <tr key={modelo.modelo_id}>
                      <td className="fw-bold">{modelo.nombre_modelo}</td>
                      <td>{modelo.nombre_marca}</td>
                      <td>
                        {modelo.imagen_glb || modelo.imagen_normal ? (
                          <Button
                            variant="link"
                            onClick={() =>
                              handleImageClick(
                                modelo.imagen_glb,
                                modelo.imagen_normal,
                                modelo.nombre_modelo
                              )
                            }
                          >
                            <FaEye />
                          </Button>
                        ) : (
                          <span className="text-muted">Sin imagen</span>
                        )}
                      </td>
                      <td>
                        <Badge bg="success">{modelo.disponibles}</Badge>
                      </td>
                      <td>
                        <Badge bg="warning" text="dark">
                          {modelo.reservados}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="danger">
                          {modelo.mantenimiento_actual ?? 0}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="secondary">
                          {modelo.futuro_mantenimiento ?? 0}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg="info" text="dark">
                          {modelo.en_reposo}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <PaginationComponent
              page={filtros.page}
              totalPages={totalPages}
              onPageChange={(page) => setFiltros({ ...filtros, page })}
            />
          </div>
        )
      )}

      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedEquipment?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedEquipment?.isGLB ? (
            // @ts-ignore
            <model-viewer
              src={selectedEquipment.imageUrl}
              alt="Modelo 3D"
              camera-controls
              auto-rotate
              style={{ width: "100%", height: "500px" }}
            />
          ) : (
            <img
              src={selectedEquipment?.imageUrl}
              alt={selectedEquipment?.name}
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                objectFit: "contain",
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
