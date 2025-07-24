import React, { useEffect, useState } from "react";
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
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [cantidadInputs, setCantidadInputs] = useState<Record<number, number>>(
    {}
  );
  const [availableEquipmentSlides, setAvailableEquipmentSlides] = useState<
    GrupoEquiposPorModelo[][]
  >([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFullView, setShowFullView] = useState(false);

  const handleImageError = () => {
    toast.error("No se pudo cargar la imagen.");
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
      setAvailableEquipmentSlides([]);
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const fetchEquipos = async (pageToLoad: number) => {
    if (!formData.tipoReserva || !isDateTimeComplete) return;
    try {
      setLoadingEquipments(true);
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

      setAvailableEquipmentSlides((prev) => [
        ...prev,
        response.data.data || response.data,
      ]);
      setTotalPages(response.data.last_page || 1);
    } catch {
      toast.error("Error al cargar equipos disponibles");
    } finally {
      setLoadingEquipments(false);
    }
  };

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
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    afterChange: (currentSlide: number) => {
      const nextPage = currentSlide + 1;
      if (
        nextPage > availableEquipmentSlides.length &&
        nextPage <= totalPages
      ) {
        setPage(nextPage);
      }
    },
  };

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
                onClick={() => setShowFullView(true)}
              >
                Visualizar full
              </Button>
            )}
          </div>
          <ul className="list-group mb-3">
            {(formData.equipment as any[]).map((eq) => (
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

      {loadingEquipments && (
        <div className="text-center my-4">
          <div className="spinner-border" role="status" />
        </div>
      )}

      {!loadingEquipments && availableEquipmentSlides.length > 0 && (
        <Slider {...sliderSettings}>
          {availableEquipmentSlides.map((grupoPagina, idx) => (
            <div key={idx}>
              <div className="row">
                {grupoPagina.map((grupo) => {
                  const equiposNoAgregados = grupo.equipos.filter(
                    (eq) =>
                      !formData.equipment?.some(
                        (sel) => sel.id === eq.equipo_id
                      )
                  );
                  if (equiposNoAgregados.length === 0) return null;

                  const max = equiposNoAgregados.length;

                  return (
                    <div className="col-md-6 mb-3" key={grupo.modelo_id}>
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
                          <p className="mb-2 text-success fw-bold">
                            {max} disponibles
                          </p>

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
            </div>
          ))}
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
