// src/components/reservas/EquipmentReservationForm.tsx
import React, { useState } from "react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import FechaReservaInput from "./Fechas";
import HorarioReservaInputs from "./Schedule";
import PrestamistaSelect from "./Prestamista";
import TipoReservaSelect from "./Tipo";
import DocumentoEventoDropzone from "./Document";
import EquiposSelect from "./Equipos";
import UbicacionSelect from "./Ubication";
import FormActions from "./FormAction";
import { Role } from "~/types/roles";
import useReservationFormLogic from "./hooks/useReservationFormLogic";
import { useAuth } from "~/hooks/AuthContext";
import "./style/reserva.css";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";
import api from "../../api/axios";
import { Spinner } from "react-bootstrap";
export default function EquipmentReservationForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingReserva, setLoadingReserva] = useState(false);
  const { id } = useParams(); // `id` será undefined si es creación
  const isEditing = !!id;
  const {
    formData,
    setFormData,
    handleSubmit,
    handleClear,
    getMinDate,
    getMaxDate,
    tipoReservaOptions,
    prestamistaOptions,
    selectedPrestamista,
    setSelectedPrestamista,
    aulaOptions,
    availableEquipmentOptions,
    allEquipmentOptions,
    uploadedFile,
    setUploadedFile,
    getStartTimeOptions,
    loading,
    isDateTimeComplete,
    checkingAvailability,
  } = useReservationFormLogic(id);

  const handleBack = () => navigate("/reservations");
  useEffect(() => {
    const fetchReserva = async () => {
      if (!id) return;
      setLoadingReserva(true); // Inicia loading

      try {
        const { data } = await api.get(`/detail/${id}`);
        console.log(data);
        setFormData({
          date: data.fecha_reserva,
          startTime: data.start_time,
          endTime: data.end_time,
          tipoReserva: {
            label: data.tipo_reserva.nombre,
            value: data.tipo_reserva.id.toString(),
          },
          aula: {
            label: data.aula.name,
            value: data.aula.id.toString(),
            path_modelo: data.aula.path_modelo,
          },
          equipment: data.equipos.map((eq: any) => ({
            id: eq.id,
            modelo_id: eq.modelo_id,
            nombre_modelo: eq.nombre_modelo,
            cantidad: 1,
            modelo_path: eq.modelo_path ?? eq.imagen_gbl ?? "",
            numero_serie: eq.numero_serie,
          })),
          modelFile: null, // opcional
        });
      } catch {
        toast.error("Error al cargar los datos de la reserva");
      } finally {
        setLoadingReserva(false); // Inicia loading
      }
    };

    fetchReserva();
  }, [id]);
  if (loadingReserva) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" role="status" variant="primary" />
        <span className="mt-3">Obteniendo datos de la reserva...</span>
      </div>
    );
  }

  return (
    <div className="form-container position-relative mb-3 mb-md-0">
      <div className="d-flex align-items-center gap-2 gap-md-3 mb-4">
        <FaLongArrowAltLeft
          onClick={handleBack}
          title="Regresar"
          style={{ cursor: "pointer", fontSize: "2rem" }}
        />
        <h2 className="fw-bold m-0">Reserva de Equipos</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <FechaReservaInput
          formData={formData}
          setFormData={setFormData}
          getMinDate={getMinDate}
          getMaxDate={getMaxDate}
        />
        <HorarioReservaInputs
          formData={formData}
          setFormData={setFormData}
          getStartTimeOptions={getStartTimeOptions}
        />
        {(user?.role === Role.Administrador ||
          user?.role === Role.Encargado) && (
          <PrestamistaSelect
            isDateTimeComplete={isDateTimeComplete}
            selectedPrestamista={selectedPrestamista}
            setSelectedPrestamista={setSelectedPrestamista}
            prestamistaOptions={prestamistaOptions}
          />
        )}
        <TipoReservaSelect
          formData={formData}
          setFormData={setFormData}
          tipoReservaOptions={tipoReservaOptions}
          loading={loading.tipoReserva}
          isDateTimeComplete={isDateTimeComplete}
        />
        <DocumentoEventoDropzone
          tipoReservaLabel={formData.tipoReserva?.label}
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
        />
        <UbicacionSelect
          formData={formData}
          setFormData={setFormData}
          aulaOptions={aulaOptions}
          loadingAulas={loading.aulas}
          isDateTimeComplete={isDateTimeComplete}
        />
        <div style={{ display: formData.aula ? "block" : "none" }}>
          <EquiposSelect
            formData={formData}
            setFormData={setFormData}
            checkingAvailability={checkingAvailability}
            isDateTimeComplete={isDateTimeComplete}
          />
        </div>
        <FormActions
          handleClear={handleClear}
          loadingSubmit={loading.submit}
          isDateTimeComplete={isDateTimeComplete}
          checkingAvailability={checkingAvailability}
          tipoReserva={formData.tipoReserva}
          selectedEquipos={formData.equipment}
          selectedAula={formData.aula}
        />
      </form>
    </div>
  );
}
