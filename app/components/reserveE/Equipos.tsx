import React, { useEffect, useState, Suspense } from "react";
import { FaBoxes, FaEye } from "react-icons/fa";
import type { FormDataType } from "./types/FormDataType";
import api from "~/api/axios";
import toast from "react-hot-toast";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { APIURL } from "./../../constants/constant";
import InteractiveScene from "../renders/rooms/Scene2";
import type { EquipmentSeleccionado } from "./types/Equipos";

interface Props {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  checkingAvailability: boolean;
  isDateTimeComplete: boolean;
}

interface EquipoIndividual {
  equipo_id: number;
  modelo_id: number;
  tipo_equipo: string;
  estado: string;
  imagen_gbl: string | null; // <- si tu campo real es modelo_path cámbialo
  imagen_normal: string | null;
  modelo_path?: string | null; // opcional si lo tienes aparte
}

interface GrupoEquiposPorModelo {
  modelo_id: number;
  nombre_modelo: string;
  nombre_marca: string;
  equipos: EquipoIndividual[];
}

/** --- Componente para mostrar GLB --- */
function ModeloGLB({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/** --- ErrorBoundary simple para Canvas/GLB --- */
class CanvasErrorBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function EquiposSelect({
  formData,
  setFormData,
  checkingAvailability,
  isDateTimeComplete,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const pageSize = 5;
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [cantidadInputs, setCantidadInputs] = useState<Record<number, number>>(
    {}
  );
  const [availableEquipmentData, setAvailableEquipmentData] = useState<{
    data: GrupoEquiposPorModelo[];
    total: number;
    current_page: number;
    per_page: number;
  } | null>(null);

  // Modal GLB individual
  const [showModalGLB, setShowModalGLB] = useState(false);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);

  // Modal Fullscreen (aula + lista equipos 3D)
  const [showFullView, setShowFullView] = useState(false);
  const [equipoActivoUrl, setEquipoActivoUrl] = useState<string | null>(null);

  const handleOpenModalGLB = (url: string) => {
    setGlbUrl(url);
    setShowModalGLB(true);
  };

  const handleImageError = () => {
    toast.error("No se pudo cargar la imagen.");
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchEquipos = async () => {
    if (!formData.tipoReserva || !isDateTimeComplete) return;
    try {
      setLoadingEquipments(true);
      const response = await api.get("/equiposDisponiblesPorTipoYFecha", {
        params: {
          tipo_reserva_id: formData.tipoReserva.value,
          fecha: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          page,
          limit: pageSize,
          search: debouncedSearchTerm,
        },
      });
      setAvailableEquipmentData(response.data);
    } catch {
      toast.error("Error al cargar equipos disponibles");
      setAvailableEquipmentData(null);
    } finally {
      setLoadingEquipments(false);
    }
  };

  useEffect(() => {
    fetchEquipos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.tipoReserva,
    formData.date,
    formData.startTime,
    formData.endTime,
    page,
    debouncedSearchTerm,
  ]);

  const handleCantidadChange = (modeloId: number, cantidad: number) => {
    setCantidadInputs((prev) => ({ ...prev, [modeloId]: cantidad }));
  };

  const agregarEquipo = (grupo: GrupoEquiposPorModelo) => {
    const idsDisponibles = grupo.equipos.map((e) => e.equipo_id);
    const yaAgregado =
      formData.equipment?.filter((e: any) => e.modelo_id === grupo.modelo_id)
        .length || 0;
    const restante = idsDisponibles.length - yaAgregado;
    const cantidad = cantidadInputs[grupo.modelo_id] || 0;

    if (cantidad < 1 || cantidad > restante) {
      toast.error(`Cantidad inválida. Máximo: ${restante}`);
      return;
    }

    const idsAsignados = idsDisponibles.slice(
      yaAgregado,
      yaAgregado + cantidad
    );

    setFormData((prev) => {
      const actuales: EquipmentSeleccionado[] = [...(prev.equipment || [])];
      idsAsignados.forEach((idEquipo) => {
        // buscamos el equipo para sacar su modelo_path / imagen_gbl
        const equipoObj = grupo.equipos.find((e) => e.equipo_id === idEquipo);
        actuales.push({
          modelo_id: grupo.modelo_id,
          nombre_modelo: grupo.nombre_modelo,
          id: idEquipo,
          cantidad: 1,
          modelo_path: equipoObj?.modelo_path ?? equipoObj?.imagen_gbl ?? "",
        });
      });
      return { ...prev, equipment: actuales };
    });

    setCantidadInputs((prev) => ({ ...prev, [grupo.modelo_id]: 0 }));
  };

  const totalPages = Math.ceil((availableEquipmentData?.total || 0) / pageSize);
  const items = availableEquipmentData?.data || [];

  // ---- Condiciones para botón Visualizar full
  const aulaModelPath: string | null =
    (formData as any)?.aula?.path_modelo || null;

  const equiposConModeloPath =
    formData.equipment?.filter(
      (eq) => eq.modelo_path && eq.modelo_path !== null
    ) || [];

  const puedeVisualizarFull =
    !!aulaModelPath && equiposConModeloPath.length > 0;

  console.log(formData.equipment);
  return (
    <div className="mb-4">
      <label className="form-label d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <FaBoxes className="me-2" />
          Equipos Disponibles
          {checkingAvailability && (
            <span className="ms-2 spinner-border spinner-border-sm"></span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="btn btn-sm ms-3"
          style={{
            backgroundColor: "rgb(2 71 102)",
            color: "#fff",
            border: "none",
          }}
        >
          <FaEye className="me-1" />
          {showDetails ? "Ocultar detalles" : "Ver disponibilidad"}
        </button>
      </label>

      {/* Siempre visible */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar modelo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {formData.equipment?.length > 0 && (
        <div className="mb-4 border rounded p-3 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Equipos seleccionados:</h5>

            {puedeVisualizarFull && (
              //@ts-ignore
              <Button
                variant="dark"
                size="sm"
                onClick={() => {
                  setEquipoActivoUrl(null);
                  setShowFullView(true);
                }}
              >
                Visualizar full
              </Button>
            )}
          </div>

          {/* Lista normal */}
          <ul className="list-group mb-3">
            {(formData.equipment as any[]).map((eq) => (
              <li
                key={eq.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                Modelo: {eq.nombre_modelo}
                <span className="badge bg-primary rounded-pill">
                  Cantidad: {eq.cantidad}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loadingEquipments ? (
        <div className="text-center my-4">
          <div className="spinner-border" role="status" />
        </div>
      ) : !items.length ? (
        <p className="text-center text-muted">No hay equipos disponibles.</p>
      ) : (
        <>
          <div className="row">
            {items.map((grupo) => {
              const yaAgregado =
                (formData.equipment as any[])?.filter(
                  (e) => e.modelo_id === grupo.modelo_id
                ).length || 0;
              const max = grupo.equipos.length - yaAgregado;
              const equipoRef = grupo.equipos[0];

              return (
                <div className="col-md-6 mb-3" key={grupo.modelo_id}>
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title text-capitalize">
                        {grupo.nombre_modelo}{" "}
                        <span className="text-muted">
                          ({grupo.equipos.length})
                        </span>
                        <br />
                        <small className="text-muted">
                          Marca: {grupo.nombre_marca}
                        </small>
                      </h5>

                      {/* Imagen o botón GLB */}
                      {equipoRef.imagen_normal ? (
                        <img
                          src={APIURL + equipoRef.imagen_normal}
                          alt={grupo.nombre_modelo}
                          className="img-fluid mb-2 rounded"
                          style={{
                            maxHeight: "150px",
                            objectFit: "contain",
                            width: "100%",
                          }}
                          onError={handleImageError}
                        />
                      ) : equipoRef.imagen_gbl ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary mb-2"
                          onClick={() =>
                            handleOpenModalGLB(APIURL + equipoRef.imagen_gbl!)
                          }
                        >
                          Visualizar
                        </button>
                      ) : null}

                      {/* Seriales */}
                      <div className="mb-2 d-flex flex-wrap gap-1">
                        {grupo.equipos.map((e) => (
                          <span
                            key={e.equipo_id}
                            className="badge bg-secondary"
                          >
                            #{e.equipo_id}
                          </span>
                        ))}
                      </div>

                      <div className="d-flex align-items-center mb-2">
                        <input
                          type="number"
                          className="form-control form-control-sm me-2"
                          style={{ width: "80px" }}
                          min={0}
                          max={max}
                          value={cantidadInputs[grupo.modelo_id] || ""}
                          placeholder="0"
                          onChange={(e) =>
                            handleCantidadChange(
                              grupo.modelo_id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => agregarEquipo(grupo)}
                          disabled={max <= 0}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav>
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link">
                    {page} / {totalPages}
                  </span>
                </li>
                <li
                  className={`page-item ${
                    page === totalPages ? "disabled" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Modal visor GLB individual */}
      <Modal
        show={showModalGLB}
        onHide={() => setShowModalGLB(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualización del modelo 3D</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ height: "500px" }}>
          {glbUrl && (
            <CanvasErrorBoundary
              onError={() => {
                toast.error("No se pudo cargar el modelo 3D.");
              }}
            >
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight />
                <OrbitControls />
                <Suspense fallback={null}>
                  <ModeloGLB url={glbUrl} />
                </Suspense>
              </Canvas>
            </CanvasErrorBoundary>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal Fullscreen Aula + lista de equipos 3D */}
      <Modal
        show={showFullView}
        onHide={() => setShowFullView(false)}
        fullscreen
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualización completa</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <div className="row g-0" style={{ height: "100%" }}>
            <div className="col-12 col-md-12" style={{ height: "100%" }}>
              <div style={{ height: "100%", minHeight: "500px" }}>
                <InteractiveScene
                  path_room={formData.aula.path_modelo}
                  equipos={equiposConModeloPath}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
