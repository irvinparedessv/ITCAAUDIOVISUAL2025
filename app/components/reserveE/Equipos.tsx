import React, { useEffect, useState } from "react";
import { FaBoxes, FaEye } from "react-icons/fa";
import type { EquipoResumen } from "./types/Equipos";
import type { FormDataType } from "./types/FormDataType";
import api from "~/api/axios";
import toast from "react-hot-toast";
interface Props {
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
  checkingAvailability: boolean;
  isDateTimeComplete: boolean;
}

export default function EquiposSelect({
  formData,
  setFormData,
  checkingAvailability,
  isDateTimeComplete,
}: Props) {
  // estados...
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showDetails, setShowDetails] = useState(false); // NUEVO
  const pageSize = 5;
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  const [cantidadInputs, setCantidadInputs] = useState<Record<number, number>>(
    {}
  );
  const [availableEquipmentData, setAvailableEquipmentData] = useState<{
    data: EquipoResumen[];
    total: number;
    current_page: number;
    per_page: number;
  } | null>(null);

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

  const agregarEquipo = (equipo: EquipoResumen) => {
    const max = equipo.cantidad_disponible - equipo.cantidad_enreserva;
    const yaAgregado =
      formData.equipment?.filter((e) => e.modelo_id === equipo.modelo_id)
        .length || 0;
    const restante = max - yaAgregado;
    const cantidad = cantidadInputs[equipo.modelo_id] || 0;

    if (cantidad < 1 || cantidad > restante) {
      toast.error(`Cantidad inválida. Máximo: ${restante}`);
      return;
    }

    const idsDisponibles =
      equipo.equipos_id_disponibles
        ?.split(",")
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id)) || [];

    const idsAsignados = idsDisponibles.slice(
      yaAgregado,
      yaAgregado + cantidad
    );

    if (idsAsignados.length < cantidad) {
      toast.error("No hay suficientes equipos disponibles.");
      return;
    }

    setFormData((prev) => {
      const actuales = [...(prev.equipment || [])];
      idsAsignados.forEach((idEquipo) => {
        actuales.push({
          modelo_id: equipo.modelo_id,
          nombre_modelo: equipo.nombre_modelo,
          id: idEquipo,
          cantidad: 1,
        });
      });
      return { ...prev, equipment: actuales };
    });

    setCantidadInputs((prev) => ({ ...prev, [equipo.modelo_id]: 0 }));
  };

  const totalPages = Math.ceil((availableEquipmentData?.total || 0) / pageSize);
  const items = availableEquipmentData?.data || [];

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

      {/* LISTA DE SELECCIONADOS */}
      {formData.equipment?.length > 0 && (
        <div className="mb-4 border rounded p-3 bg-light">
          <h5 className="mb-3">Equipos seleccionados:</h5>
          <ul className="list-group">
            {formData.equipment.map((eq) => (
              <li
                key={eq.modelo_id}
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
        <div className="text-center">
          <div className="spinner-border" role="status" />
        </div>
      ) : !items.length ? (
        <p className="text-center text-muted">No hay equipos disponibles.</p>
      ) : (
        <>
          <input
            type="text"
            className="form-control mb-3"
            placeholder="Buscar modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="row">
            {items.map((equipo) => {
              const yaAgregado =
                formData.equipment?.find(
                  (e) => e.modelo_id === equipo.modelo_id
                )?.cantidad || 0;
              const max =
                equipo.cantidad_disponible -
                equipo.cantidad_enreserva -
                yaAgregado;

              return (
                <div className="col-md-6 mb-3" key={equipo.modelo_id}>
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title text-capitalize">
                        Modelo: {equipo.nombre_modelo}
                      </h5>

                      {showDetails && (
                        <>
                          <p className="card-text mb-1">
                            Total: {equipo.cantidad_total}
                          </p>
                          <p className="card-text mb-1 text-success">
                            Disponibles: {equipo.cantidad_disponible}
                          </p>
                          <p className="card-text mb-1 text-warning">
                            En Reserva: {equipo.cantidad_enreserva}
                          </p>
                        </>
                      )}

                      <div className="d-flex align-items-center mb-2">
                        <input
                          type="number"
                          className="form-control form-control-sm me-2"
                          style={{ width: "80px" }}
                          min={0}
                          max={max}
                          value={cantidadInputs[equipo.modelo_id] || ""}
                          placeholder="0"
                          onChange={(e) =>
                            handleCantidadChange(
                              equipo.modelo_id,
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => agregarEquipo(equipo)}
                          disabled={max <= 0}
                        >
                          Agregar
                        </button>
                      </div>

                      <div className="d-flex justify-content-between">
                        <button
                          type="button"
                          className="btn btn-sm btn-info"
                          disabled
                        >
                          Detalle
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled
                        >
                          Ver imagen
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
    </div>
  );
}
