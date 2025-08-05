import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { FaChevronLeft, FaChevronRight, FaPlus } from "react-icons/fa";
import api from "~/api/axios";
import toast from "react-hot-toast";
import type { FormDataType } from "./types/FormDataType";

interface EquipoDetalleModalProps {
  show: boolean;
  onHide: () => void;
  equipoIds: number[];
  initialIndex: number;
  grupoEquipos: any; // el grupo actual, puedes tipar si gustas
  formData: FormDataType;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType>>;
}

export default function EquipoDetalleModal({
  show,
  onHide,
  equipoIds,
  initialIndex,
  grupoEquipos,
  formData,
  setFormData,
}: EquipoDetalleModalProps) {
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<any>(null);
  const [page, setPage] = useState(initialIndex);
  const [ids, setIds] = useState<number[]>(equipoIds);

  // Resetea ids y page cada vez que abres el modal o cambia el grupo/array inicial
  useEffect(() => {
    if (show) {
      setIds(equipoIds);
      setPage(initialIndex);
    }
  }, [show, equipoIds, initialIndex]);

  // Trae detalle solo del equipo actual (por page)
  useEffect(() => {
    if (!show || ids.length === 0) return;
    setLoading(true);
    const equipoIdActual = ids[page];
    api
      .get(`/equipo-detalle/${equipoIdActual}`)
      .then((res) => setDetalle(res.data))
      .catch(() => setDetalle(null))
      .finally(() => setLoading(false));
  }, [page, ids, show]);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(ids.length - 1, p + 1));

  const equipoSeleccionado =
    detalle && formData.equipment.some((eq) => eq.id === detalle.id);

  const handleAgregarEquipo = () => {
    if (!detalle) return;
    if (formData.equipment.some((eq) => eq.id === detalle.id)) {
      toast.error("El equipo ya está seleccionado.");
      return;
    }

    // Agrega al formData
    setFormData((prev) => ({
      ...prev,
      equipment: [
        ...(prev.equipment || []),
        {
          modelo_id: detalle.modelo.id,
          nombre_modelo: detalle.modelo.nombre,
          id: detalle.id,
          cantidad: 1,
          modelo_path:
            detalle.modelo.imagen_glb ?? detalle.modelo.imagen_normal ?? "",
          numero_serie: detalle.numero_serie,
          escala: detalle.modelo.escala ?? 1,
          en_reposo: detalle.en_reposo ?? false,
        },
      ],
    }));

    // Quitar del array local ids
    setIds((prev) => {
      const newIds = prev.filter((id) => id !== detalle.id);
      // Si el actual era el último y quedan más, retrocede la página
      if (page >= newIds.length && newIds.length > 0)
        setPage(newIds.length - 1);
      // Si ya no hay ninguno, cierra el modal
      if (newIds.length === 0) onHide();
      return newIds;
    });

    // Quita también del grupo (mantiene consistencia en pantalla padre)
    if (grupoEquipos) {
      const idx = grupoEquipos.equipos.findIndex(
        (e: any) => e.equipo_id === detalle.id
      );
      if (idx !== -1) {
        grupoEquipos.equipos.splice(idx, 1);
      }
    }

    toast.success("Equipo agregado a la reserva.");
  };

  // Si no quedan ids, no renderiza nada
  if (ids.length === 0) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className="equipo-detalle-modal"
    >
      <Modal.Header
        closeButton
        style={{ border: "none", background: "#f8f9fa" }}
      >
        <Modal.Title>
          Detalles del Equipo&nbsp;
          <span style={{ fontSize: "0.9em", color: "#888" }}>
            ({page + 1} / {ids.length})
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="position-relative p-0">
        {/* Flecha izquierda */}
        <Button
          variant="light"
          className="arrow-btn left-arrow"
          onClick={handlePrev}
          disabled={page === 0 || loading || ids.length === 0}
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            borderRadius: "50%",
            boxShadow: "0 0 8px #aaa",
            border: "1px solid #d4d4d4",
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: page === 0 ? 0.3 : 1,
            pointerEvents: page === 0 ? "none" : "auto",
          }}
        >
          <FaChevronLeft />
        </Button>

        {/* Contenido central */}
        <div
          style={{
            margin: "0 56px",
            minHeight: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {loading ? (
            <div className="w-100 text-center py-5">
              <div className="spinner-border text-primary" />
              <div className="mt-2">Cargando...</div>
            </div>
          ) : detalle ? (
            <div style={{ width: "100%", maxWidth: 450 }}>
              <div className="mb-2">
                <b>Serie:</b> {detalle.numero_serie}
              </div>
              <div className="mb-2">
                <b>Tipo de equipo:</b> {detalle.tipo_equipo}
              </div>
              <div className="mb-2">
                <b>Modelo:</b> {detalle.modelo?.nombre}
              </div>
              <div className="mb-2">
                <b>Marca:</b> {detalle.modelo?.marca}
              </div>
              <div className="mb-2">
                <b>Detalles:</b> {detalle.detalles}
              </div>
              <div className="mb-2">
                <b>Comentario:</b> {detalle.comentario || "N/A"}
              </div>
              <div>
                <b>Características:</b>
                <ul>
                  {detalle.caracteristicas?.map((carac, i) => (
                    <li key={i}>
                      {carac.nombre}: {carac.valor} ({carac.tipo_dato})
                    </li>
                  ))}
                </ul>
              </div>
              {/* Botón agregar equipo */}
              {!equipoSeleccionado && (
                <div className="text-center mt-4">
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleAgregarEquipo}
                    style={{
                      borderRadius: 24,
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      padding: "0.7rem 2.5rem",
                    }}
                  >
                    <FaPlus className="me-2" />
                    Agregar equipo
                  </Button>
                </div>
              )}
              {equipoSeleccionado && (
                <div className="text-center mt-4 text-success fw-bold">
                  Ya agregado a la reserva
                </div>
              )}
            </div>
          ) : (
            <div className="w-100 text-center py-5">
              No se pudo cargar la información.
            </div>
          )}
        </div>

        {/* Flecha derecha */}
        <Button
          variant="light"
          className="arrow-btn right-arrow"
          onClick={handleNext}
          disabled={page === ids.length - 1 || loading || ids.length === 0}
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            borderRadius: "50%",
            boxShadow: "0 0 8px #aaa",
            border: "1px solid #d4d4d4",
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: page === ids.length - 1 ? 0.3 : 1,
            pointerEvents: page === ids.length - 1 ? "none" : "auto",
          }}
        >
          <FaChevronRight />
        </Button>
      </Modal.Body>
      <div className="text-end pb-3 px-4">
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}
