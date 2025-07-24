import React, { useEffect, useState, useRef } from "react";
import { FaBoxes, FaEye, FaEyeSlash } from "react-icons/fa";
import type { FormDataType } from "./types/FormDataType";
import api from "~/api/axios";
import toast from "react-hot-toast";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { APIURL } from "./../../constants/constant";
import InteractiveScene from "../renders/rooms/Scene2";
import type { EquipmentSeleccionado } from "./types/Equipos";
import Slider from "react-slick";

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
  imagen_glb: string | null;
  imagen_normal: string | null;
  numero_serie: string;
  modelo_path?: string | null;
}

interface GrupoEquiposPorModelo {
  modelo_id: number;
  nombre_modelo: string;
  nombre_marca: string;
  equipos: EquipoIndividual[];
  imagen_glb: string | null;
  imagen_normal: string | null;
}

export default function EquiposSelect({
  formData,
  setFormData,
  checkingAvailability,
  isDateTimeComplete,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [cantidadInputs, setCantidadInputs] = useState<Record<number, number>>(
    {}
  );
  const [availableEquipmentSlides, setAvailableEquipmentSlides] = useState<
    GrupoEquiposPorModelo[]
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const pagesLoaded = useRef<Set<number>>(new Set());

  const handleImageError = () => {
    toast.error("No se pudo cargar la imagen.");
  };

  // Debounce de búsqueda
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
      setAvailableEquipmentSlides([]);
      pagesLoaded.current.clear();
      setLoadingSearch(true);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchEquipos = async (pageToLoad: number) => {
    if (!formData.tipoReserva || !isDateTimeComplete) return;
    if (pagesLoaded.current.has(pageToLoad)) return;

    try {
      // Solo mostrar loadingSearch en la primera carga tras búsqueda.
      if (pageToLoad !== 1) setLoadingNextPage(true);

      const response = await api.get("/equiposDisponiblesPorTipoYFecha", {
        params: {
          tipo_reserva_id: formData.tipoReserva.value,
          fecha: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          page: pageToLoad,
          limit: 5,
          search: debouncedSearchTerm,
        },
      });

      const rows: GrupoEquiposPorModelo[] = response.data.data || [];
      setAvailableEquipmentSlides((prev) => [...prev, ...rows]);
      setTotalPages(response.data.last_page || 1);
      pagesLoaded.current.add(pageToLoad);
    } catch {
      toast.error("Error al cargar equipos disponibles");
    } finally {
      if (pageToLoad === 1) setLoadingSearch(false);
      setLoadingNextPage(false);
    }
  };

  // Dispara fetch al cambiar página o filtros base
  useEffect(() => {
    fetchEquipos(page);
  }, [
    formData.tipoReserva,
    formData.date,
    formData.startTime,
    formData.endTime,
    debouncedSearchTerm,
    page,
  ]);

  const handleCantidadChange = (modeloId: number, cantidad: number) => {
    setCantidadInputs((prev) => ({ ...prev, [modeloId]: cantidad }));
  };

  const agregarEquipo = (grupo: GrupoEquiposPorModelo) => {
    const idsDisponibles = grupo.equipos
      .filter((e) => !formData.equipment?.some((sel) => sel.id === e.equipo_id))
      .map((e) => e.equipo_id);

    const cantidad = cantidadInputs[grupo.modelo_id] || 0;

    if (cantidad < 1 || cantidad > idsDisponibles.length) {
      toast.error(`Cantidad inválida. Máximo: ${idsDisponibles.length}`);
      return;
    }

    const idsAsignados = idsDisponibles.slice(0, cantidad);

    setFormData((prev) => {
      const actuales: EquipmentSeleccionado[] = [...(prev.equipment || [])];
      idsAsignados.forEach((idEquipo) => {
        const equipoObj = grupo.equipos.find((e) => e.equipo_id === idEquipo);
        actuales.push({
          modelo_id: grupo.modelo_id,
          nombre_modelo: grupo.nombre_modelo,
          id: idEquipo,
          cantidad: 1,
          modelo_path: equipoObj?.modelo_path ?? equipoObj?.imagen_glb ?? "",
          numero_serie: equipoObj?.numero_serie,
        });
      });
      return { ...prev, equipment: actuales };
    });

    setCantidadInputs((prev) => ({ ...prev, [grupo.modelo_id]: 0 }));
  };

  const aulaModelPath: string | null =
    (formData as any)?.aula?.path_modelo || null;
  const equiposConModeloPath =
    formData.equipment?.filter(
      (eq) => eq.modelo_path && eq.modelo_path !== null
    ) || [];
  const puedeVisualizarFull =
    !!aulaModelPath && equiposConModeloPath.length > 0;

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 300,
    slidesToShow: 2,
    slidesToScroll: 1,
    arrows: true,
    afterChange: (currentSlide: number) => {
      const threshold = availableEquipmentSlides.length - 4; // precarga anticipada
      if (
        currentSlide >= threshold &&
        page < totalPages &&
        !pagesLoaded.current.has(page + 1)
      ) {
        setPage((prev) => prev + 1);
      }
    },
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const noResults =
    !loadingSearch &&
    availableEquipmentSlides.length === 0 &&
    isDateTimeComplete &&
    !!formData.tipoReserva;

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
          className="btn btn-sm ms-3 bgpri"
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

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar modelo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Loader sólo cuando se hace búsqueda */}
      {loadingSearch && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-2">Buscando equipos...</div>
        </div>
      )}

      {/* Sin resultados */}
      {noResults && (
        <div className="alert alert-warning text-center my-4" role="alert">
          No se encontraron equipos con esos filtros.
        </div>
      )}

      {formData.equipment?.length > 0 && (
        <div className="mb-4 border rounded p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Equipos seleccionados:</h5>
            {puedeVisualizarFull && (
              //@ts-ignore
              <Button
                variant="dark"
                size="sm"
                className="bgpri"
                onClick={() => setShowFullView(true)}
              >
                Visualizar full
              </Button>
            )}
          </div>
          <ul className="list-group mb-3">
            {formData.equipment.map((eq) => (
              <li
                key={eq.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                Modelo: {eq.nombre_modelo}
                <span className="badge bg-primary rounded-pill">
                  Serie: {eq.numero_serie}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loadingSearch && availableEquipmentSlides.length > 0 && (
        <Slider {...sliderSettings}>
          {availableEquipmentSlides.map((grupo, index) => {
            const equiposNoAgregados = grupo.equipos.filter(
              (eq) =>
                !formData.equipment?.some((sel) => sel.id === eq.equipo_id)
            );
            if (equiposNoAgregados.length === 0) return null;

            const max = equiposNoAgregados.length;

            return (
              <div
                key={`${grupo.modelo_id}_${index}`}
                className="px-2"
                style={{ width: 300 }}
              >
                <div className="card h-100 shadow-sm border-0">
                  {grupo.imagen_normal ? (
                    <img
                      src={APIURL + grupo.imagen_normal}
                      alt={grupo.nombre_modelo}
                      className="card-img-top"
                      style={{
                        height: "180px",
                        objectFit: "contain",
                        backgroundColor: "#f8f9fa",
                      }}
                      onError={handleImageError}
                    />
                  ) : grupo.imagen_glb ? (
                    //@ts-ignore
                    <model-viewer
                      src={APIURL + grupo.imagen_glb}
                      alt="Modelo 3D"
                      camera-controls
                      autoplay
                      vr
                      ar
                      ar-modes="webxr scene-viewer quick-look"
                      style={{
                        height: "180px",
                        width: "100%",
                        backgroundColor: "#f8f9fa",
                      }}
                      shadow-intensity="1"
                      interaction-prompt="none"
                      auto-rotate
                    />
                  ) : (
                    <div
                      style={{
                        height: "180px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#f8f9fa",
                        fontSize: "1.5rem",
                        color: "#999",
                      }}
                    >
                      <FaEyeSlash className="me-2" />
                      Sin imagen
                    </div>
                  )}

                  <div className="card-body">
                    <h5 className="card-title text-capitalize mb-1">
                      {grupo.nombre_modelo}
                    </h5>
                    <p className="mb-1 text-muted">
                      Marca: {grupo.nombre_marca}
                    </p>
                    <p className="mb-2 text-bgpri fw-bold">{max} disponibles</p>

                    <div className="d-flex align-items-center">
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
                        className="btn btn-sm btn-success bgpri"
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

          {/* Skeleton para la página siguiente */}
          {loadingNextPage && (
            <div className="px-2" style={{ width: 300 }}>
              <div className="card h-100 border-0 bg-light d-flex align-items-center justify-content-center">
                <div className="spinner-border text-secondary" role="status" />
              </div>
            </div>
          )}
        </Slider>
      )}

      <Modal
        show={showFullView}
        onHide={() => setShowFullView(false)}
        fullscreen
      >
        <Modal.Header closeButton>
          <Modal.Title>Visualización completa</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <InteractiveScene
            path_room={formData.aula?.path_modelo ?? ""}
            equipos={equiposConModeloPath}
            setFormData={setFormData}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}
