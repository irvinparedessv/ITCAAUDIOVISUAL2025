import React, { useEffect, useState, useRef } from "react";
import { FaBoxes, FaExchangeAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import type { FormDataType } from "./types/FormDataType";
import api from "~/api/axios";
import toast from "react-hot-toast";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { APIURL } from "./../../constants/constant";
import InteractiveScene from "../renders/rooms/Scene2";
import type { EquipmentSeleccionado } from "./types/Equipos";
import { FaFileAlt, FaTrash } from "react-icons/fa";

import Slider from "react-slick";
import { useAuth } from "~/hooks/AuthContext";
import { Role } from "~/types/roles";
import VisualizarModal from "../attendantadmin/VisualizarModal";

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
  escala: number;
  en_reposo?: boolean;
}

interface GrupoEquiposPorModelo {
  modelo_id: number;
  nombre_modelo: string;
  nombre_marca: string;
  equipos: EquipoIndividual[];
  imagen_glb: string | null;
  imagen_normal: string | null;
  en_reposo?: number;
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
  const { user } = useAuth();
  const [totalPages, setTotalPages] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const pagesLoaded = useRef<Set<number>>(new Set());
  const [totalItems, setTotalItems] = useState<number>(0);
  const [equipoAEditar, setEquipoAEditar] =
    useState<EquipmentSeleccionado | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [equiposDisponiblesMismoModelo, setEquiposDisponiblesMismoModelo] =
    useState<EquipoIndividual[]>([]);
  const [showReposoModal, setShowReposoModal] = useState(false);
  const [equipoReposoSeleccionado, setEquipoReposoSeleccionado] = useState<{
    eq: EquipoIndividual;
    grupo: GrupoEquiposPorModelo;
  } | null>(null);
  const handleImageError = () => {
    toast.error("No se pudo cargar la imagen.");
  };
  const [tempModelUrl, setTempModelUrl] = useState<string | null>(null);
  const [showVisualizar, setShowVisualizar] = useState(false);
  useEffect(() => {
    if (formData.modelFile) {
      const tempUrl = URL.createObjectURL(formData.modelFile);
      setTempModelUrl(tempUrl);

      return () => {
        URL.revokeObjectURL(tempUrl);
        setTempModelUrl(null);
      };
    }
  }, [formData.modelFile]);
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
      if (pageToLoad !== 1) setLoadingNextPage(true);

      const response = await api.get("/equiposDisponiblesPorTipoYFecha", {
        params: {
          tipo_reserva_id: formData.tipoReserva.value,
          fecha: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          page: pageToLoad,
          limit: 10,
          search: debouncedSearchTerm,
        },
      });

      const rows: GrupoEquiposPorModelo[] = response.data.data || [];
      setAvailableEquipmentSlides((prev) => {
        const nuevos = rows.filter(
          (nuevo) =>
            !prev.some((existente) => existente.modelo_id === nuevo.modelo_id)
        );
        return [...prev, ...nuevos];
      });
      setTotalItems(response.data.total);
      setTotalPages(response.data.last_page || 1);
      pagesLoaded.current.add(pageToLoad);
    } catch (error) {
      toast.error("Error al cargar equipos disponibles");
    } finally {
      if (pageToLoad === 1) setLoadingSearch(false);
      setLoadingNextPage(false);
    }
  };
  useEffect(() => {
    setLoadingSearch(true);

    // Reset de equipos disponibles cuando cambia fecha, hora o tipo de reserva
    setAvailableEquipmentSlides([]);
    pagesLoaded.current.clear();
    setPage(1);
  }, [
    formData.tipoReserva,
    formData.date,
    formData.startTime,
    formData.endTime,
  ]);
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
      .filter(
        (e) =>
          !formData.equipment?.some((sel) => sel.id === e.equipo_id) &&
          !e.en_reposo
      )
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
          escala: equipoObj?.escala,
          en_reposo: equipoObj?.en_reposo,
        });
      });
      return { ...prev, equipment: actuales };
    });

    setCantidadInputs((prev) => ({ ...prev, [grupo.modelo_id]: 0 }));
  };

  // FUNCIONES PARA EQUIPOS EN REPOSO
  const handleAgregarReposo = (
    eq: EquipoIndividual,
    grupo: GrupoEquiposPorModelo
  ) => {
    setEquipoReposoSeleccionado({ eq, grupo });
    setShowReposoModal(true);
  };

  const confirmarAgregarReposo = () => {
    if (!equipoReposoSeleccionado) return;
    setFormData((prev) => {
      const actuales: EquipmentSeleccionado[] = [...(prev.equipment || [])];
      actuales.push({
        modelo_id: equipoReposoSeleccionado.grupo.modelo_id,
        nombre_modelo: equipoReposoSeleccionado.grupo.nombre_modelo,
        id: equipoReposoSeleccionado.eq.equipo_id,
        cantidad: 1,
        modelo_path:
          equipoReposoSeleccionado.eq.modelo_path ??
          equipoReposoSeleccionado.eq.imagen_glb ??
          "",
        numero_serie: equipoReposoSeleccionado.eq.numero_serie,
        escala: equipoReposoSeleccionado.eq.escala,
        en_reposo: true,
      });
      return { ...prev, equipment: actuales };
    });
    setShowReposoModal(false);
    setEquipoReposoSeleccionado(null);
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
      const threshold = availableEquipmentSlides.length - 4;
      if (
        currentSlide >= threshold &&
        page < totalPages &&
        !pagesLoaded.current.has(page + 1)
      ) {
        setPage((prev) => prev + 1);
      }
    },
    customPaging: (i: number) => (
      <button
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "#ccc",
          border: "none",
        }}
      />
    ),
    appendDots: (dots: React.ReactNode) => {
      const dotsArray = Array.isArray(dots) ? dots : [];

      return (
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {Array.from({ length: totalItems - 1 }, (_, i) => (
            <span key={i}>
              {dotsArray[i] || (
                <button
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#eee",
                    border: "none",
                  }}
                />
              )}
            </span>
          ))}
        </div>
      );
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

  useEffect(() => {
    if (
      availableEquipmentSlides.length >= 10 &&
      page < totalPages &&
      !pagesLoaded.current.has(page + 1)
    ) {
      const siguiente = page + 1;
      fetchEquipos(siguiente);
      setPage(siguiente);
    }
  }, [availableEquipmentSlides]);

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

            {Boolean(!formData.modelFile && puedeVisualizarFull) ? (
              //@ts-ignore
              <Button
                variant="dark"
                size="sm"
                className="bgpri"
                onClick={() => setShowFullView(true)}
              >
                Visualizar En Espacio
              </Button>
            ) : formData.modelFile ? (
              <div className="d-flex align-items-center gap-2">
                <FaFileAlt style={{ fontSize: "1.5rem", color: "#0d6efd" }} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    if (tempModelUrl) setShowVisualizar(true);
                    else toast.error("No se pudo generar la vista previa");
                  }}
                >
                  Visualizar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, modelFile: null }))
                  }
                >
                  Eliminar modelo
                </Button>
              </div>
            ) : null}
          </div>

          <ul className="list-group mb-3">
            {formData.equipment.map((eq) => (
              <li
                key={eq.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  Modelo: {eq.nombre_modelo}{" "}
                  <span className="badge bg-primary ms-2">
                    Serie: {eq.numero_serie}
                  </span>
                  {eq.en_reposo && (
                    <span className="badge bg-danger ms-2">En reposo</span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  {(user?.role === Role.Administrador ||
                    user?.role === Role.Encargado) && (
                    //@ts-ignore

                    <Button
                      variant="outline-warning"
                      size="sm"
                      title="Cambiar equipo (pendiente)"
                      onClick={() => {
                        const grupo = availableEquipmentSlides.find(
                          (g) => g.modelo_id === eq.modelo_id
                        );
                        if (!grupo)
                          return toast.error(
                            "No se encontraron equipos disponibles de ese modelo."
                          );

                        const disponibles = grupo.equipos.filter(
                          (e) =>
                            !formData.equipment.some(
                              (f) => f.id === e.equipo_id
                            )
                        );
                        if (disponibles.length === 0)
                          return toast(
                            "No hay equipos disponibles para reemplazar."
                          );

                        setEquipoAEditar(eq);
                        setEquiposDisponiblesMismoModelo(disponibles);
                        setShowEditModal(true);
                      }}
                    >
                      <FaExchangeAlt className="fs-5" />
                    </Button>
                  )}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    title="Eliminar equipo"
                    onClick={() => {
                      // 1. Eliminar del formData
                      const equipoEliminado = formData.equipment.find(
                        (item) => item.id === eq.id
                      );
                      if (!equipoEliminado) return;

                      setFormData((prev) => ({
                        ...prev,
                        equipment: prev.equipment.filter(
                          (item) => item.id !== eq.id
                        ),
                      }));

                      // 2. Devolver a disponibles
                      setAvailableEquipmentSlides((prev) => {
                        return prev.map((grupo) => {
                          if (grupo.modelo_id !== equipoEliminado.modelo_id)
                            return grupo;

                          // Solo si no estaba ya
                          const yaExiste = grupo.equipos.some(
                            (e) => e.equipo_id === equipoEliminado.id
                          );
                          if (yaExiste) return grupo;

                          const nuevoEquipo: EquipoIndividual = {
                            equipo_id: equipoEliminado.id,
                            modelo_id: equipoEliminado.modelo_id,
                            numero_serie: equipoEliminado.numero_serie!,
                            estado: "Disponible",
                            tipo_equipo: "",
                            imagen_glb: null,
                            imagen_normal: null,
                            modelo_path: equipoEliminado.modelo_path ?? null,
                            escala: equipoEliminado.escala,
                            en_reposo: equipoEliminado.en_reposo,
                          };

                          return {
                            ...grupo,
                            equipos: [...grupo.equipos, nuevoEquipo],
                          };
                        });
                      });
                    }}
                  >
                    <FaTrash />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!loadingSearch && availableEquipmentSlides.length > 0 && (
        <Slider {...sliderSettings}>
          {availableEquipmentSlides.map((grupo, index) => {
            const equiposFiltrados = grupo.equipos.filter(
              (eq) =>
                !formData.equipment?.some((sel) => sel.id === eq.equipo_id)
            );

            const cantidadDisponibles = equiposFiltrados.filter(
              (eq) => !eq.en_reposo
            ).length;

            if (equiposFiltrados.length === 0) return null;

            return (
              <div
                key={`${grupo.modelo_id}_${index}`}
                className="px-2"
                style={{ width: 300 }}
              >
                <div className="card h-100 shadow-sm border-0">
                  {grupo.imagen_normal ? (
                    <img
                      src={APIURL + "/" + grupo.imagen_normal}
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
                      src={APIURL + "/" + grupo.imagen_glb}
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
                    <h5 className="card-title text-capitalize mb-1 d-flex justify-content-between align-items-center">
                      {grupo.nombre_modelo}
                      {grupo.en_reposo > 0 && (
                        <span className="badge bg-danger ms-2">
                          {grupo.en_reposo} en reposo
                        </span>
                      )}
                    </h5>
                    <p className="mb-1 text-muted">
                      Marca: {grupo.nombre_marca}
                    </p>
                    <div className="mb-2">
                      <span className="fw-bold text-bgpri me-2">
                        {cantidadDisponibles} disponibles
                      </span>
                      {grupo.en_reposo > 0 && (
                        <span className="badge bg-danger">
                          {grupo.en_reposo} en reposo
                        </span>
                      )}
                    </div>

                    <div className="d-flex align-items-center mb-2">
                      <input
                        type="number"
                        className="form-control form-control-sm me-2"
                        style={{ width: "80px" }}
                        min={0}
                        max={cantidadDisponibles}
                        value={cantidadInputs[grupo.modelo_id] || ""}
                        placeholder="0"
                        onChange={(e) =>
                          handleCantidadChange(
                            grupo.modelo_id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={cantidadDisponibles === 0}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-success bgpri"
                        onClick={() => agregarEquipo(grupo)}
                        disabled={cantidadDisponibles === 0}
                      >
                        Agregar
                      </button>
                    </div>

                    {/* Mostrar equipos en reposo */}
                    {grupo.equipos
                      .filter(
                        (eq) =>
                          eq.en_reposo &&
                          !formData.equipment?.some(
                            (sel) => sel.id === eq.equipo_id
                          )
                      )
                      .map((eq) => (
                        <div
                          key={eq.equipo_id}
                          className="d-flex align-items-center mt-2"
                        >
                          <span className="badge bg-danger me-2">
                            En reposo
                          </span>
                          <span className="me-2">Serie: {eq.numero_serie}</span>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleAgregarReposo(eq, grupo)}
                          >
                            Agregar en reposo
                          </button>
                        </div>
                      ))}
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
        <Modal.Header closeButton onHide={() => setShowFullView(false)}>
          <Modal.Title>VISUALIZACIÓN</Modal.Title>
        </Modal.Header>{" "}
        <Modal.Body className="p-0">
          <InteractiveScene
            path_room={formData.aula?.path_modelo ?? ""}
            equipos={equiposConModeloPath}
            setFormData={setFormData}
            onClose={() => setShowFullView(false)}
            escala={formData.aula?.escala ?? 1}
          />
        </Modal.Body>
      </Modal>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cambio de equipo por mismo modelo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {equiposDisponiblesMismoModelo.map((e) => (
            <div
              key={e.equipo_id}
              className="border p-2 d-flex justify-content-between align-items-center mb-2"
            >
              <div>
                <strong>Serie:</strong> {e.numero_serie}
              </div>
              <Button
                variant="success"
                size="sm"
                //@ts-ignore
                onClick={() => {
                  if (!equipoAEditar) return;
                  setFormData((prev) => {
                    const actualizados = prev.equipment.map((item) =>
                      item.id === equipoAEditar.id
                        ? {
                            ...item,
                            id: e.equipo_id,
                            numero_serie: e.numero_serie,
                            modelo_path: e.modelo_path ?? e.imagen_glb ?? "",
                          }
                        : item
                    );
                    return { ...prev, equipment: actualizados };
                  });
                  setAvailableEquipmentSlides((prev) =>
                    prev.map((grupo) => {
                      if (grupo.modelo_id !== equipoAEditar.modelo_id)
                        return grupo;
                      const nuevaLista = grupo.equipos
                        .filter((eq) => eq.equipo_id !== e.equipo_id)
                        .concat({
                          equipo_id: equipoAEditar.id,
                          modelo_id: equipoAEditar.modelo_id,
                          numero_serie: equipoAEditar.numero_serie!,
                          estado: "Disponible",
                          tipo_equipo: "",
                          imagen_glb: null,
                          imagen_normal: null,
                          modelo_path: equipoAEditar.modelo_path ?? null,
                          escala: equipoAEditar.escala,
                          en_reposo: equipoAEditar.en_reposo,
                        });
                      return { ...grupo, equipos: nuevaLista };
                    })
                  );
                  setShowEditModal(false);
                  setEquipoAEditar(null);
                }}
              >
                Cambiar
              </Button>
            </div>
          ))}
          {equiposDisponiblesMismoModelo.length === 0 && (
            <div className="text-muted text-center">
              No hay equipos disponibles
            </div>
          )}
        </Modal.Body>
      </Modal>
      {/* MODAL CONFIRMACIÓN EN REPOSO */}
      <Modal show={showReposoModal} onHide={() => setShowReposoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Equipo en reposo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Atención:</strong> Este equipo está en{" "}
            <span className="text-danger fw-bold">reposo</span>.
            <br />
            Si lo agregas, la reserva{" "}
            <b>solo podrá ser aprobada por un gerente</b> y no por el encargado.
          </p>
          <div className="mb-2">
            <span className="badge bg-danger me-2">En reposo</span>
            Serie: {equipoReposoSeleccionado?.eq.numero_serie}
          </div>
          <div>¿Deseas continuar?</div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setShowReposoModal(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            type="button"
            onClick={confirmarAgregarReposo}
          >
            Sí, agregar en reposo
          </Button>
        </Modal.Footer>
      </Modal>
      <VisualizarModal
        show={showVisualizar}
        onHide={() => setShowVisualizar(false)}
        path={tempModelUrl}
      />
    </div>
  );
}
