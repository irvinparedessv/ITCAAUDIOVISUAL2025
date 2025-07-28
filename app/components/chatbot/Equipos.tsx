import React, { useEffect, useState, useRef } from "react";
import { FaBoxes, FaEye, FaEyeSlash, FaTrash } from "react-icons/fa";
import api from "~/api/axios";
import toast from "react-hot-toast";
import Slider from "react-slick";
import Button from "react-bootstrap/Button";
import { APIURL } from "~/constants/constant";

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
}

interface GrupoEquiposPorModelo {
  modelo_id: number;
  nombre_modelo: string;
  nombre_marca: string;
  equipos: EquipoIndividual[];
  imagen_glb: string | null;
  imagen_normal: string | null;
}

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  checkingAvailability: boolean;
  isDateTimeComplete: boolean;
  onGuardarReserva?: (data: any) => void;
  onCancelarReserva?: () => void;
  onModificarReserva?: (msg: string) => void;
}
export default function EquiposSelect({
  formData,
  setFormData,
  checkingAvailability,
  isDateTimeComplete,
  onGuardarReserva,
  onCancelarReserva,
  onModificarReserva,
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
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loadingNextPage, setLoadingNextPage] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const pagesLoaded = useRef<Set<number>>(new Set());

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

  // Reset de equipos disponibles cuando cambia fecha, hora o aula seleccionada
  useEffect(() => {
    setLoadingSearch(true);
    setAvailableEquipmentSlides([]);
    pagesLoaded.current.clear();
    setPage(1);
  }, [formData.aula, formData.fecha, formData.horaInicio, formData.horaFin]);

  // Buscar equipos solo si hay datos mínimos
  const puedeBuscarEquipos =
    !!formData.aula &&
    !!formData.fecha &&
    !!formData.horaInicio &&
    !!formData.horaFin;

  // Llama API con los nuevos campos
  const fetchEquipos = async (pageToLoad: number) => {
    if (!puedeBuscarEquipos) return;
    if (pagesLoaded.current.has(pageToLoad)) return;
    try {
      if (pageToLoad !== 1) setLoadingNextPage(true);

      const response = await api.get("/equiposDisponiblesPorTipoYFecha", {
        params: {
          tipo_reserva_id: 3, // Aulas
          fecha: formData.fecha,
          startTime: formData.horaInicio,
          endTime: formData.horaFin,
          aula_id: formData.aula.id,
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

  // Dispara fetch al cambiar página o filtros base
  useEffect(() => {
    fetchEquipos(page);
    // eslint-disable-next-line
  }, [puedeBuscarEquipos, debouncedSearchTerm, page]);

  // Slider settings
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
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const handleCantidadChange = (modeloId: number, cantidad: number) => {
    setCantidadInputs((prev) => ({ ...prev, [modeloId]: cantidad }));
  };

  // Adaptado: agrega equipos a formData.equiposSeleccionados
  const agregarEquipo = (grupo: GrupoEquiposPorModelo) => {
    const idsDisponibles = grupo.equipos
      .filter(
        (e) =>
          !formData.equiposSeleccionados?.some(
            (sel: any) => sel.id === e.equipo_id
          )
      )
      .map((e) => e.equipo_id);

    const cantidad = cantidadInputs[grupo.modelo_id] || 0;

    if (cantidad < 1 || cantidad > idsDisponibles.length) {
      toast.error(`Cantidad inválida. Máximo: ${idsDisponibles.length}`);
      return;
    }

    const idsAsignados = idsDisponibles.slice(0, cantidad);
    setFormData((prev: any) => {
      const actuales = [...(prev.equiposSeleccionados || [])];
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
        });
      });
      return { ...prev, equiposSeleccionados: actuales };
    });

    setCantidadInputs((prev) => ({ ...prev, [grupo.modelo_id]: 0 }));
  };

  // Para eliminar equipo de la lista
  const eliminarEquipo = (eq: any) => {
    setFormData((prev: any) => ({
      ...prev,
      equiposSeleccionados: (prev.equiposSeleccionados || []).filter(
        (item: any) => item.id !== eq.id
      ),
    }));
  };

  const noResults =
    !loadingSearch &&
    availableEquipmentSlides.length === 0 &&
    puedeBuscarEquipos;

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
      </label>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar modelo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loadingSearch && (
        <div className="text-center my-4">
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-2">Buscando equipos...</div>
        </div>
      )}
      {noResults && (
        <div className="alert alert-warning text-center my-4" role="alert">
          No se encontraron equipos con esos filtros.
        </div>
      )}

      {formData.equiposSeleccionados?.length > 0 && (
        <div className="mb-4 border rounded p-3">
          <h5>Equipos seleccionados:</h5>
          <ul className="list-group mb-3">
            {formData.equiposSeleccionados.map((eq: any) => (
              <li
                key={eq.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  Modelo: {eq.nombre_modelo}
                  <span className="badge bg-primary ms-2">
                    Serie: {eq.numero_serie}
                  </span>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  title="Eliminar equipo"
                  onClick={() => eliminarEquipo(eq)}
                >
                  <FaTrash />
                </Button>
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
                !formData.equiposSeleccionados?.some(
                  (sel: any) => sel.id === eq.equipo_id
                )
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
                      src={grupo.imagen_normal}
                      alt={grupo.nombre_modelo}
                      className="card-img-top"
                      style={{
                        height: "180px",
                        objectFit: "contain",
                        backgroundColor: "#f8f9fa",
                      }}
                    />
                  ) : grupo.imagen_glb ? (
                    // Si tienes model-viewer aquí
                    <div
                      style={{
                        height: "180px",
                        width: "100%",
                        backgroundColor: "#f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* @ts-ignore */}
                      <model-viewer
                        src={APIURL + "/" + grupo.imagen_glb}
                        alt={grupo.nombre_modelo}
                        camera-controls
                        style={{
                          width: 120,
                          height: 100,
                          background: "#f4f6fa",
                          borderRadius: 12,
                        }}
                        auto-rotate
                        shadow-intensity="1"
                      />
                    </div>
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
                    <p className="mb-2 fw-bold">{max} disponibles</p>
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
          {loadingNextPage && (
            <div className="px-2" style={{ width: 300 }}>
              <div className="card h-100 border-0 bg-light d-flex align-items-center justify-content-center">
                <div className="spinner-border text-secondary" role="status" />
              </div>
            </div>
          )}
        </Slider>
      )}

      {formData.equiposSeleccionados?.length > 0 && (
        <div className="d-flex flex-wrap gap-3 justify-content-end mt-4">
          {/* @ts-ignore */}
          <Button
            variant="primary"
            onClick={() => {
              // Debes pasar la función que guarde la reserva de equipos
              // Puedes enviar formData, por ejemplo:
              onGuardarReserva && onGuardarReserva(formData);
            }}
            disabled={formData.equiposSeleccionados.length === 0}
          >
            Guardar Reserva
          </Button>
          <Button
            variant="outline-danger"
            onClick={() => {
              // Debes pasar tu función para resetear el chat
              onCancelarReserva && onCancelarReserva();
            }}
          >
            Cancelar Reserva
          </Button>
          <Button
            variant="outline-secondary"
            onClick={() => {
              // Envía el mensaje al chatbot para modificar
              if (onModificarReserva) {
                onModificarReserva(
                  "Quiero cambiar algunos datos de mi reserva"
                );
              }
            }}
          >
            Modificar Reserva
          </Button>
        </div>
      )}
    </div>
  );
}
